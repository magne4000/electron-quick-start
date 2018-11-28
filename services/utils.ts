import Peer from '@magne4000/json-rpc-peer';
// tslint:disable-next-line
import 'reflect-metadata';
import { RPCChannel } from 'stream-json-rpc';

const namespace = Symbol('bx:namespace');
const methods = Symbol('bx:methods');
const targetInterface = Symbol('bx:target-interface');

const d = require('debug')('service:utils');

const getOwnMetadata = (m: symbol, aclass: any) => {
  let md: Map<string, string> | undefined = Reflect.getOwnMetadata(m, aclass);
  if (!md) {
    md = new Map();
    Reflect.defineMetadata(m, md, aclass);
  }
  return md;
};

export const Service = (nmsp: string) => class ServiceAbstract {
  static readonly [namespace] = nmsp;
  peer: Peer;

  constructor(peer: Peer) {
    this.peer = peer;
  }

  public connect(channel: RPCChannel, constructor?: Function) {
    if (constructor) {
      Reflect.defineMetadata(targetInterface, constructor, this);
    }
    const md: Map<string, string> = Reflect.getMetadata(methods, this);

    for (const [methodName, methodIdentifier] of md) {
      d('setRequestHandler', methodIdentifier);
      channel.setRequestHandler(methodIdentifier, (params: any) => {
        return Reflect.get(this, methodName)(params);
      });
    }
  }
};

export const method = (methodIdentifier?: string): MethodDecorator => {
  return (aclass: ReturnType<typeof Service>, methodName: string) => {
    const md: Map<string, string> = getOwnMetadata(methods, aclass);
    const fullUri = `${aclass.constructor[namespace]}:${methodIdentifier || methodName}`;
    d('new method', methodName, fullUri);
    md.set(methodName, fullUri);
  };
};

export const request = <T>(aclass: any, methodName: string, descriptor: TypedPropertyDescriptor<T>) => {
  // console.log(aclass, methodName, descriptor)
  /*
  descriptor.get = () => ((params: any) => {
    // tslint:disable-next-line
    const self: Service = this;
    const constructor: Function = Reflect.getOwnMetadata(targetInterface, self);
    const targetMethods: Map<string, string> = Reflect.getOwnMetadata(methods, constructor);
    d('calling request', methodName, targetMethods.get(methodName));
    return self.peer.request(targetMethods.get(methodName), params);
  }) as any as T;*/
};
