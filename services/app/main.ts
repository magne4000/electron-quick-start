import { app } from 'electron';
import { endpoint, request, service, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

@service('app')
export class AppMain extends Service implements RPC.Node<IApp> {

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

  @endpoint({ type: 'notification' })
  onAppSomething() {
    console.log('received event');
  }
}
