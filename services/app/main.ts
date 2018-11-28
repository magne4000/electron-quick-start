import { app } from 'electron';
import { method, request, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppMain extends Service('app') implements RPC.Node<IApp> {

  static readonly ['nmsp'] = 'guy';
  @method()
  async getName() {
    return app.getName();
  }

  @request
  async getValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.peer.request('app:getValuePlusOne', params);
  }
}
