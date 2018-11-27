import Peer from '@magne4000/json-rpc-peer';
import { app } from 'electron';
import { RPCChannel } from 'stream-json-rpc';
import { IApp, IAppGgetValuePlusOneParams, IAppNode } from './interface';

export class AppNode implements RPC.Client<IAppNode> {
  peer: Peer;

  constructor(peer: Peer) {
    this.peer = peer;
  }

  getName() {
    return this.peer.request('app:getName');
  }

  askGetValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.peer.request('app:askGetValuePlusOne', params);
  }

  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}

export const bindImpl = (peer: RPCChannel, impl: RPC.Client<IApp>) => {
  peer.setRequestHandler('app:getName', () => {
    return impl.getName();
  });
  peer.setRequestHandler('app:askGetValuePlusOne', (params: IAppGgetValuePlusOneParams) => {
    return impl.getValuePlusOne(params);
  });
};
