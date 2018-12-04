// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';
import { RPCChannel, RPCChannelPeer } from 'stream-json-rpc';

const uuidv4 = require('uuid/v4');

type Endpoint = {
  type: 'request' | 'notification',
  getId: () => string,
};
type EndpointMap = Map<string, Endpoint>;

const namespace = Symbol('bx:namespace');
const endpoints = Symbol('bx:endpoints');
const targetInterface = Symbol('bx:target-interface');

const d = require('debug')('service:utils');

export class ServicesRegistry {
  registry: Map<string, new (...args: any[]) => Service>;

  constructor() {
    this.registry = new Map();
  }

  add(klass: new (...args: any[]) => Service, n?: string) {
    const nmsp: string = n || (klass as any)[namespace];
    if (this.registry.has(nmsp)) {
      throw new Error(`A Service is already registered for ${nmsp}`);
    }
    this.registry.set(nmsp, klass);
  }

  get(key: string) {
    return this.registry.get(key);
  }
}

export const registry = new ServicesRegistry();
const allServicesRegistry = new ServicesRegistry();

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
    d('new service', n, aclass.name);
    aclass[namespace] = n;
    allServicesRegistry.add(aclass, `${n}:${aclass.name}`);
  };
};

export abstract class Service {
  public peer: RPCChannelPeer;
  public channel: RPCChannel;
  private [targetInterface]: Function | undefined;

  constructor(channel: RPCChannel, linkId: string = '__default__') {
    this.channel = channel;
    this.peer = channel.peer(`${(this.constructor as any)[namespace]}:${linkId}`);
    // TODO release peer on both sides when not used anymore
  }

  public connect(constructor?: Function) {
    if (constructor) {
      d('setTargetInterface', constructor.name);
      this[targetInterface] = constructor;
    }
    console.log(this.constructor.name, constructor.name)
    const md: EndpointMap = Reflect.getMetadata(endpoints, this) || new Map();

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodInfos] of Array.from(md.entries())) {
      const methodIdentifier = methodInfos.getId();
      d('defining a new handler', methodInfos.type, methodIdentifier);
      if (methodInfos.type === 'request') {
        this.peer.setRequestHandler(methodIdentifier, (params: any) => {
          d('request handler called', methodName);
          return Reflect.apply(Reflect.get(this, methodName), this, [unserializeParams(this.channel, params)]);
        });
      } else {
        this.peer.setNotificationHandler(methodIdentifier, (params: any) => {
          d('notification handler called', methodName);
          Reflect.apply(Reflect.get(this, methodName), this, [unserializeParams(this.channel, params)]);
        });
      }
    }
  }
}

export abstract class ObserverService extends Service {
  uuid: string;

  constructor(channel: RPCChannel, uuid?: string) {
    const u = uuid || uuidv4();
    super(channel, u);
    this.uuid = u;
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

type SerializedObserver = { $$uuid: string, $$namespace: string, $$constructor: string };

const serializeParams = (params: ObserverService | any): SerializedObserver | any => {
  d('serializeParams');
  if (params instanceof ObserverService) {
    const ret: SerializedObserver = {
      $$uuid: params.uuid,
      $$namespace: (params.constructor as any)[namespace],
      $$constructor: params.constructor.name,
    };
    d('serializeParams:ObserverService', ret);
    return ret;
  }
  return params;
};

const unserializeParams = (channel: RPCChannel, params: SerializedObserver | any): ObserverService | any => {
  if (params && params.$$uuid && params.$$constructor && params.$$namespace) {
    try {
      const klass = registry.get(params.$$namespace);
      const remoteService = new klass(channel, params.$$uuid);
      const remoteClass = allServicesRegistry.get(`${params.$$namespace}:${params.$$constructor}`);
      remoteService.connect(remoteClass);
      d('unserializeParams:ObserverService', params);
      return remoteService;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  return params;
};

const remoteMethod = (cb: Function) => (aclass: Service, methodName: string) => {
  Object.defineProperty(aclass.constructor.prototype, methodName, {
    value: function (this: Service, params: Service | any) {
      try {
        const constructor: Function | undefined = this[targetInterface];
        if (!constructor) {
          throw new Error('No remote class where given to `connect` method. ' +
            `Can't make remote request.`);
        }

        const targetMethods: EndpointMap = Reflect.getMetadata(endpoints, constructor.prototype);
        const methodId = targetMethods.get(methodName).getId();
        d('calling remote', methodName, methodId);
        return cb(this.peer, methodId, serializeParams(params));
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
  });
};

export const request = remoteMethod((peer: RPCChannelPeer, key: string, params: any) => {
  return peer.request(key, params);
});

export const notify = remoteMethod((peer: RPCChannelPeer, key: string, params: any) => {
  peer.notify(key, params);
});
