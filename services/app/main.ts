import { app } from 'electron';
import { IApp } from './interface';

export class AppMain implements RPC.Client<IApp> {
  // @decorator to bind in main?
  async getName() {
    return app.getName();
  }
}

export const bindImpl = (peer: any, impl: IApp) => {
  peer.addHander('getName', () => {
    return impl.getName();
  });
};
