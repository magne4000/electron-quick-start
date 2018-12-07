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
  registry: Map<string, new (...args: any[]) => ServiceSimple<any>>;

  constructor() {
    this.registry = new Map();
  }

  add(klass: new (...args: any[]) => ServiceSimple<any>, n?: string) {
    const nmsp: string = n || (klass as any)[namespace];
    if (this.registry.has(nmsp)) {
      throw new Error(`A Service is already registered for ${nmsp}`);
    }
    this.registry.set(nmsp, klass);
  }

  get(key: string) {
    return this.registry.get(key);
  }

  has(key: string) {
    return this.registry.has(key);
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

export abstract class ServiceBase {
  public channel: RPCChannel;
  public uuid: string;
  public peer: RPCChannelPeer;

  private [targetInterface]: Function | undefined;

  constructor(channel: RPCChannel, uuid?: string) {
    this.uuid = uuid || uuidv4();
    this.channel = channel;
    this.peer = channel.peer(`${(this.constructor as any)[namespace]}:${this.uuid}`);
    // TODO release peer on both sides when not used anymore
  }

  public connect(constructor?: Function) {
    if (constructor) {
      d('setTargetInterface', constructor.name);
      this[targetInterface] = constructor;
    }
    const md: EndpointMap = Reflect.getMetadata(endpoints, this) || new Map();

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodInfos] of Array.from(md.entries())) {
      this.remoteMethodHandler(methodName, methodInfos);
    }
    console.log(Array.from(this.peer.requestHandlers.keys()));
  }

  protected remoteMethodHandler(methodName: string, methodInfos: Endpoint) {
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

export abstract class ServiceSimple<T extends RPC.Node<T>> extends ServiceBase {
  constructor(channel: RPCChannel, uuid?: string) {
    super(channel, uuid);
    this.connect();
  }

  /*  We can't define it here, because static method typing is a mess
      See https://github.com/Microsoft/TypeScript/issues/14600 for details
  static get Node(this: T) {
    return getNode(this);
  }
  */
}

export const getNode = <T extends RPC.Node<T>>(base: T): T => {
  const NewClass = class extends ServiceSimple<T>{};
  service((base as any)[namespace], { endpointsOnly: false, register: false })(NewClass);
  const constructorHandler = {
    construct: (target: T, args: any[]) => {
      return new Proxy(
        new NewClass(args[0], args[1]),
        getObjectHandler(Reflect.getMetadata(endpoints, (base as any).prototype) || new Map())
      );
    },
  };
  const getObjectHandler = (md: EndpointMap) => ({
    get: (obj: any, prop: string) => {
      if (obj.hasOwnProperty(prop)) {
        return Reflect.get(obj, prop);
      }
      const methodInfos = md.get(prop);
      if (methodInfos) {
        return getPeerMethod(obj.peer, prop, methodInfos);
      }
    },
  });
  return new Proxy(base as any, constructorHandler);
};

type EndpointOptions = {
  methodIdentifier?: string,
  type?: 'request' | 'notification',
};
type SerializedObserver = { $$uuid: string, $$namespace: string, $$constructor: string };
type ServiceDecoratorOptions = { endpointsOnly?: boolean, observer?: boolean, register?: boolean };

const serializeParams = (params: ServiceBase | any): SerializedObserver | any => {
  d('serializeParams');
  if (params instanceof ServiceBase) {
    const ret: SerializedObserver = {
      $$uuid: params.uuid,
      $$namespace: (params.constructor as any)[namespace],
      $$constructor: params.constructor.name,
    };
    d('serializeParams ServiceBase', ret);
    return ret;
  }
  return params;
};

const unserializeParams = (channel: RPCChannel, params: SerializedObserver | any): ServiceBase | any => {
  d('unserializeParams', params);
  if (params && params.$$uuid && params.$$constructor && params.$$namespace) {
    try {
      const klass = registry.get(params.$$namespace);
      if (klass.prototype instanceof ServiceSimple) {
        d('unserializeParams:ServiceSimple');
        return new (getNode(klass) as any)(channel, params.$$uuid);
      }
      d('unserializeParams:ServiceBase');

      const remoteService = new klass(channel, params.$$uuid);
      const uri = `${params.$$namespace}:${params.$$constructor}`;
      if (!allServicesRegistry.has(uri)) {
        throw new Error(`Unknown class in registry ${uri}`);
      }
      const remoteClass = allServicesRegistry.get(uri);
      remoteService.connect(remoteClass);
      return remoteService;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  return params;
};

export const request = (aprototype: ServiceSimple<any>, methodName: string) => {
  Object.defineProperty(aprototype.constructor.prototype, methodName, {
    value: function (this: ServiceSimple<any>, params: ServiceSimple<any> | any) {
      try {
        const constructor: Function | undefined = this[targetInterface];
        if (!constructor) {
          throw new Error('No remote class where given to `connect` method. ' +
            `Can't make remote request.`);
        }

        const targetMethods: EndpointMap = Reflect.getMetadata(endpoints, constructor.prototype);
        const methodId = targetMethods.get(methodName).getId();
        d('calling remote', methodName, methodId);
        return getPeerMethod(this.peer, methodId, params);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
  });
};

export const getPeerMethod = (peer: RPCChannelPeer, key: string, methodInfos: Endpoint) => {
  const methodId = methodInfos.getId();
  d('calling remote', key, methodId);
  if (methodInfos.type === 'request') {
    return (params: any) => peer.request(methodId, serializeParams(params));
  }
  return (params: any) => peer.notify(methodId, serializeParams(params));
};

export const endpoint = (options: EndpointOptions = {}) => {
  return (aclass: any, methodName: string) => {
    const fullUriGetter = () => `${aclass.constructor[namespace]}:${options.methodIdentifier || methodName}`;
    const infos: Endpoint = {
      getId: fullUriGetter,
      type: options.type || 'request',
    };
    d('new endpoint', methodName);
    setMetadata(endpoints, methodName, infos, aclass);
  };
};

/**
 * Set the namespace for the Service.
 * ⚠ This is called after methods decorators.
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html#decorator-evaluation
 */
export const service = (n: string, options: ServiceDecoratorOptions = {}) => {
  const defaultOptions = {
    register: true,
    endpointsOnly: true,
    observer: false,
  };
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };
  return (aclass: any) => {
    d('new service', n, aclass.name);
    aclass[namespace] = n;
    if (mergedOptions.register) {
      allServicesRegistry.add(aclass, `${n}:${aclass.name}`);
    }

    if (mergedOptions.endpointsOnly) {
      bindServiceEndpoints(aclass, mergedOptions);
    }
  };
};

const bindServiceEndpoints = (aclass: any, options: ServiceDecoratorOptions) => {
  for (const key of Object.keys(aclass.prototype)) {
    if (key === 'constructor') continue;
    const attribute: unknown = aclass.prototype[key];
    if (typeof attribute === 'function') {
      const endpointOptions: EndpointOptions = {
        type: options.observer ? 'notification' : 'request',
      };
      endpoint(endpointOptions)(aclass.prototype, key);
    }
  }
};
