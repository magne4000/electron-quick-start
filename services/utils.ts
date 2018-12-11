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
const bxobserver = 'bx:observer';

const d = require('debug')('service:utils');

export class ServicesRegistry {
  registry: Map<string, new (...args: any[]) => ServiceBase>;

  constructor() {
    this.registry = new Map();
  }

  add(klass: new (...args: any[]) => ServiceBase, n?: string) {
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

export class ServicePeerHandler {
  public channel: RPCChannel;
  protected connectedServices: WeakMap<ServiceBase, RPCChannelPeer>;

  constructor(channel: RPCChannel) {
    this.channel = channel;
    this.connectedServices = new WeakMap();
  }

  public connect(srvc: ServiceBase, constructor?: Function): RPCChannelPeer {
    if (this.isConnected(srvc)) {
      return this.connectedServices.get(srvc);
    }
    d('connecting', srvc.constructor.name);
    let requestsMetadata: EndpointMap = new Map();
    if (constructor) {
      d('target interface', constructor.name);
      requestsMetadata = Reflect.getMetadata(endpoints, constructor.prototype) || new Map();
    }

    const peer = this.channel.peer(`${(srvc as any)[namespace]}:${srvc.uuid}`);
    const endpointsMetadata: EndpointMap = Reflect.getMetadata(endpoints, srvc) || new Map();

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodInfos] of Array.from(endpointsMetadata.entries())) {
      this.remoteMethodHandler(peer, srvc, methodName, methodInfos);
    }
    for (const [methodName, methodInfos] of Array.from(requestsMetadata.entries())) {
      this.bindRequests(peer, srvc, methodName, methodInfos);
    }
    if (srvc instanceof ServicePeer) {
      srvc.peer = peer;
    }
    this.connectedServices.set(srvc, peer);
    // TODO release peer on both sides when not used anymore
    return peer;
  }

  public isConnected(srvc: ServiceBase) {
    return this.connectedServices.has(srvc);
  }

  protected remoteMethodHandler(peer: RPCChannelPeer, srvc: ServiceBase, methodName: string, methodInfos: Endpoint) {
    const methodIdentifier = methodInfos.getId();
    d('defining a new handler', methodInfos.type, methodIdentifier);
    if (methodInfos.type === 'request') {
      peer.setRequestHandler(methodIdentifier, (params: any) => {
        d('request handler called', methodName);
        return Reflect.apply(Reflect.get(srvc, methodName), srvc, [unserializeParams(this, params)]);
      });
    } else {
      peer.setNotificationHandler(methodIdentifier, (params: any) => {
        d('notification handler called', methodName);
        Reflect.apply(Reflect.get(srvc, methodName), srvc, [unserializeParams(this, params)]);
      });
    }
  }

  protected bindRequests(peer: RPCChannelPeer, srvc: ServiceBase, methodName: string, methodInfos: Endpoint) {
    const requestMethod = getRequestMethod(peer, methodInfos, this);
    d('defining a new request', methodInfos.type, methodInfos.getId());
    Object.defineProperty(srvc.constructor.prototype, methodName, {
      value: function (this: ServiceBase, params: ServiceBase | any) {
        try {
          return requestMethod(params);
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      configurable: false,
    });
  }
}

export abstract class ServiceBase {
  public uuid: string;

  constructor(uuid?: string) {
    this.uuid = uuid || uuidv4();
  }
}

export abstract class ServicePeer extends ServiceBase {
  peer: RPCChannelPeer | undefined;

  constructor(uuid?: string, srvcPeerHandler?: ServicePeerHandler) {
    super(uuid);
    if (srvcPeerHandler) {
      srvcPeerHandler.connect(this);
    }
  }

  /*  We can't define it here, because static method typing is a mess
      See https://github.com/Microsoft/TypeScript/issues/14600 for details
  static get Node(this: T) {
    return getNode(this);
  }
  */
}

@service(bxobserver, { endpointsOnly: false })
export class ServiceObserverPeer extends ServicePeer {
  constructor(uuid: string, srvcPeerHandler: ServicePeerHandler) {
    super(uuid, srvcPeerHandler);
    return new Proxy(this, {
      get: (obj: ServiceObserverPeer, prop: string) => {
        if (prop in obj) {
          return Reflect.get(obj, prop);
        }
        if (!obj.peer) {
          throw new Error('ServiceObserverPeer not connected');
        }
        return getRequestMethod(obj.peer, {
          type: 'notification',
          getId: () => getFullUri(bxobserver, prop),
        }, srvcPeerHandler);
      },
    });
  }
}

export const getNode = <T>(base: T): T => {
  class ServiceNode extends ServicePeer {}
  const nmsp = (base as any)[namespace];
  service(nmsp, { endpointsOnly: false, register: false })(ServiceNode);
  const constructorHandler = {
    construct: (target: typeof ServiceNode, args: any[]) => {
      return new Proxy(
        new ServiceNode(args[0], args[1]),
        getObjectHandler(Reflect.getMetadata(endpoints, target.prototype) || new Map())
      );
    },
  };
  const getObjectHandler = (md: EndpointMap) => ({
    get: (obj: ServiceNode, prop: string) => {
      if (prop in obj) {
        return Reflect.get(obj, prop);
      }
      const methodInfos = md.get(prop);
      if (methodInfos) {
        if (!obj.peer) {
          throw new Error('ServiceObserverPeer not connected');
        }
        return getRequestMethod(obj.peer, methodInfos);
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

const serializeParams = (params: ServiceBase | any, srvcPeerHandler?: ServicePeerHandler): SerializedObserver | any => {
  d('serializeParams');
  if (params instanceof ServiceBase) {
    if (srvcPeerHandler && !srvcPeerHandler.isConnected(params)) {
      d('serializeParams Dynamic connection', params);
      srvcPeerHandler.connect(params);
    }
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

const unserializeParams = (srvcPeerHandler: ServicePeerHandler, params: SerializedObserver | any): ServiceBase | any => {
  d('unserializeParams', params);
  if (params && params.$$uuid && params.$$constructor && params.$$namespace) {
    try {
      if (params.$$namespace === bxobserver) {
        d('unserializeParams:Observer');
        return new ServiceObserverPeer(params.$$uuid, srvcPeerHandler);
      }
      const klass = registry.get(params.$$namespace);
      if (!klass) {
        throw new Error(`Unknown class for namespace ${params.$$namespace}`);
      }
      if (klass.prototype instanceof ServiceBase) {
        d('unserializeParams:ServiceBase');
        const node = new (getNode(klass) as any)(params.$$uuid);

        const uri = `${params.$$namespace}:${params.$$constructor}`;
        if (!allServicesRegistry.has(uri)) {
          console.warn(`Unknown class in registry ${uri}`);
          srvcPeerHandler.connect(node);
        } else {
          srvcPeerHandler.connect(node, allServicesRegistry.get(uri));
        }

        srvcPeerHandler.connect(node);
        return node;
      }
      throw new Error('Bidirectionnal flow: not maintained for now');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  return params;
};

export const getRequestMethod = (peer: RPCChannelPeer, methodInfos: Endpoint, srvcPeerHandler?: ServicePeerHandler) => {
  const methodId = methodInfos.getId();
  d('calling remote', methodInfos.type, methodId);
  if (methodInfos.type === 'request') {
    return (params: any) => peer.request(methodId, serializeParams(params, srvcPeerHandler));
  }
  return (params: any) => peer.notify(methodId, serializeParams(params, srvcPeerHandler));
};

const getFullUri = (nmsp: string, methodName: string) => {
  return `${nmsp}:${methodName}`;
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

export const observer = (srvcPeerHandler: ServicePeerHandler) => <T extends RPC.Interface<T>>(object: RPC.Node<T> | T): RPC.Node<T> => {
  class DynamicObserver extends ServiceBase {}
  Object.assign(DynamicObserver.prototype, object);
  service(bxobserver, { observer: true, register: false })(DynamicObserver);
  const dynobs = new DynamicObserver();
  srvcPeerHandler.connect(dynobs);
  return dynobs as any as RPC.Node<T>;
};
