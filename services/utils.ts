// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';
import { RPCChannelPeer, RPCChannel } from 'stream-json-rpc';

type Endpoint = {
  type: 'request' | 'notification',
  getId: () => string,
};
type EndpointMap = Map<string, Endpoint>;

const namespace = Symbol('bx:namespace');
const endpoints = Symbol('bx:endpoints');
const targetInterface = Symbol('bx:target-interface');

const d = require('debug')('service:utils');

const setMetadata = (m: symbol | string, key: string, value: any, aclass: any) => {
  let md: Map<string, any> | undefined = Reflect.getOwnMetadata(m, aclass);
  if (!md) {
    md = new Map();
    Reflect.defineMetadata(m, md, aclass);
  }
  md.set(key, value);
};

/**
 * Set the namespace for the Service.
 * ⚠ This is called after method decorators.
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html#decorator-evaluation
 * @param n Service's namespace
 */
export const service = (n: string) => {
  return (aclass: any) => {
    aclass[namespace] = n;
  };
};

export abstract class Service {
  public peer: RPCChannelPeer;
  private [targetInterface]: Function | undefined;

  constructor(channel: RPCChannel, linkId?: string) {
    this.peer = channel.peer(linkId || (this.constructor as any)[namespace]);
  }

  public connect(constructor?: Function) {
    if (constructor) {
      d('setTargetInterface', constructor.name);
      this[targetInterface] = constructor;
    }
    const md: EndpointMap = Reflect.getMetadata(endpoints, this);

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodInfos] of Array.from(md.entries())) {
      const methodIdentifier = methodInfos.getId();
      console.log(methodInfos)
      d('defining a new handler', methodInfos.type, methodIdentifier);
      if (methodInfos.type === 'request') {
        this.peer.setRequestHandler(methodIdentifier, (params: any) => {
          d('request handler called', methodName);
          return Reflect.apply(Reflect.get(this, methodName), this, [params]);
        });
      } else {
        this.peer.setNotificationHandler(methodIdentifier, (params: any) => {
          d('notification handler called', methodName);
          Reflect.apply(Reflect.get(this, methodName), this, [params]);
        });
      }
    }
  }
}

type EndpointOptions = {
  methodIdentifier?: string,
  type?: 'request' | 'notification',
};

export const endpoint = (options: EndpointOptions = {}): MethodDecorator => {
  return (aclass: any, methodName: string) => {
    const fullUriGetter = () => `${aclass.constructor[namespace]}:${options.methodIdentifier || methodName}`;
    const infos: Endpoint = {
      getId: fullUriGetter,
      type: options.type || 'request',
    };
    d('new method', methodName);
    setMetadata(endpoints, methodName, infos, aclass);
  };
};

const remoteMethod = (cb: Function) => (aclass: Service, methodName: string) => {
  Object.defineProperty(aclass.constructor.prototype, methodName, {
    value: function (this: Service, params: any) {
      const constructor: Function | undefined = this[targetInterface];
      if (!constructor) {
        throw new Error('No remote class where given to `connect` method. ' +
          `Can't make remote request.`);
      }

      const targetMethods: EndpointMap = Reflect.getMetadata(endpoints, constructor.prototype);
      const methodId = targetMethods.get(methodName).getId();
      d('calling remote', methodName, methodId);
      return cb(this.peer, methodId, params);
    },
  });
};

export const request = remoteMethod((peer: RPCChannelPeer, key: string, params: any) => {
  return peer.request(key, params);
});

export const notify = remoteMethod((peer: RPCChannelPeer, key: string, params: any) => {
  peer.notify(key, params);
});
