import Peer from '@magne4000/json-rpc-peer';
import { app } from 'electron';
import { RPCChannel } from 'stream-json-rpc';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppMain implements RPC.Client<IApp> {
  peer: Peer;

  constructor(peer: Peer) {
    this.peer = peer;
  }

  // @decorator to bind in main?
  async getName() {
    return app.getName();
  }

  async getValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.peer.request('app:getValuePlusOne', params);
  }
}

export const bindImpl = (peer: RPCChannel, impl: RPC.Client<IApp>) => {
  peer.setRequestHandler('app:getValuePlusOne', (params: IAppGgetValuePlusOneParams) => {
    return impl.getValuePlusOne(params);
  });
};
