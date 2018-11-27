import { app } from 'electron';
import { RPCChannel } from 'stream-json-rpc';
import { IApp } from './interface';

export class AppMain implements RPC.Client<IApp> {
  // @decorator to bind in main?
  async getName() {
    return app.getName();
  }
}

export const bindImpl = (peer: RPCChannel, impl: RPC.Client<IApp>) => {
  peer.setRequestHandler('app:getName', () => {
    return impl.getName();
  });
};
