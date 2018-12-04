import { app } from 'electron';
import { endpoint, ObserverService, request, service, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams, IAppObserver, IAppVersion } from './interface';

@service('app')
export class AppNode extends Service implements RPC.Node<IApp> {

  @request
  getName: RPC.Node<IApp>['getName'];

  @request
  askGetValuePlusOne: RPC.Node<IApp>['askGetValuePlusOne'];

  @request
  requestNotifications: RPC.Node<IApp>['requestNotifications'];

  @endpoint({ methodIdentifier: 'plusone' })
  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}

@service('app:version')
export class AppNodeVersion extends ObserverService implements RPC.Node<IAppVersion> {

  @request
  getVersion: RPC.Node<IAppVersion>['getVersion'];
}

@service('app:observer')
export class AppNodeObserver extends ObserverService implements RPC.Node<IAppObserver> {

  appVersion: RPC.Node<IAppVersion>;

  @endpoint({ type: 'notification' })
  async onAppSomething(appVersion: RPC.Node<IAppVersion>) {
    this.appVersion = appVersion;
    console.log('appVersion retrieved', appVersion);
  }
}
