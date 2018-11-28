import { app } from 'electron';
import { method, request, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppMain extends Service('app') implements RPC.Node<IApp> {

  @method()
  async getName() {
    return app.getName();
  }

  @method()
  askGetValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.getValuePlusOne(params);
  }

  @request
  async getValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return undefined as any;
  }
}
