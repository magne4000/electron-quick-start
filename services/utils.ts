// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';
import { RPCChannelPeer } from 'stream-json-rpc';

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

export const service = (n: string) => {
  return (aclass: any) => {
    aclass[namespace] = n;
  };
};

export abstract class Service {
  public peer: RPCChannelPeer;
  private [targetInterface]: Function | undefined;

  constructor(peer: RPCChannelPeer) {
    this.peer = peer;
  }

  public connect(constructor?: Function) {
    if (constructor) {
      d('setTargetInterface', constructor.name);
      this[targetInterface] = constructor;
    }
    const md: Map<string, string> = Reflect.getMetadata(endpoints, this);

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodIdentifier] of Array.from(md.entries())) {
      d('setRequestHandler', methodIdentifier);
      this.peer.setRequestHandler(methodIdentifier, (params: any) => {
        d('handler called', methodName);
        return Reflect.apply(Reflect.get(this, methodName), this, [params]);
      });
    }
  }
}

export const endpoint = (methodIdentifier?: string): MethodDecorator => {
  return (aclass: any, methodName: string) => {
    const fullUri = `${aclass.constructor[namespace]}:${methodIdentifier || methodName}`;
    d('new method', methodName, fullUri);
    setMetadata(endpoints, methodName, fullUri, aclass);
  };
};

export const request = (aclass: Service, methodName: string) => {
  Object.defineProperty(aclass.constructor.prototype, methodName, {
    value: function (this: Service, params: any) {
      const constructor: Function | undefined = this[targetInterface];
      if (!constructor) {
        throw new Error('No remote class where given to `connect` method. ' +
          `Can't make remote request.`);
      }

      const targetMethods: Map<string, string> = Reflect.getMetadata(endpoints, constructor.prototype);
      d('calling request', methodName, targetMethods, methodName);
      return this.peer.request(targetMethods.get(methodName), params);
    },
  });
};
