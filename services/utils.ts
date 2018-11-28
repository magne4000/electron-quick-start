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
  public peer: Peer;
  private [targetInterface]: Function;

  constructor(peer: Peer) {
    this.peer = peer;
  }

  public connect(channel: RPCChannel, constructor?: Function) {
    if (constructor) {
      d('setTargetInterface', constructor.name);
      this[targetInterface] = constructor;
    }
    const md: Map<string, string> = Reflect.getMetadata(methods, this);

    // Some weird behavior here, we're unable to loop onto md
    // without putting it through `Array.from`...
    // Probably comes from electron-compile
    for (const [methodName, methodIdentifier] of Array.from(md.entries())) {
      d('setRequestHandler', methodIdentifier);
      channel.setRequestHandler(methodIdentifier, (params: any) => {
        d('handler called', methodName);
        return Reflect.apply(Reflect.get(this, methodName), this, [params]);
      });
    }
  }
};

export const method = (methodIdentifier?: string): MethodDecorator => {
  return (aclass: any, methodName: string) => {
    const md: Map<string, string> = getOwnMetadata(methods, aclass);
    const fullUri = `${aclass.constructor[namespace]}:${methodIdentifier || methodName}`;
    d('new method', methodName, fullUri);
    md.set(methodName, fullUri);
  };
};

export const request = (aclass: any, methodName: string) => {
  Object.defineProperty(aclass.constructor.prototype, methodName, {
    get: function () {
      // tslint:disable-next-line
      const self: any = this;
      return (params: any) => {
        const constructor: Function = self[targetInterface];
        const targetMethods: Map<string, string> = Reflect.getMetadata(methods, constructor.prototype);
        d('calling request', methodName, targetMethods, methodName);
        return self.peer.request(targetMethods.get(methodName), params);
      };
    },
  });
};
