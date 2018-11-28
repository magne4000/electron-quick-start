import { app } from 'electron';
import { endpoint, request, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppMain extends Service('app') implements RPC.Node<IApp> {

  @request
  getValuePlusOne: RPC.Node<IApp>['getValuePlusOne'];

  @endpoint()
  async getName() {
    return app.getName();
  }

  @endpoint()
  askGetValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.getValuePlusOne(params);
  }
}
