import { app } from 'electron';
import { endpoint, notify, ObserverService, request, service, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams, IAppObserver, IAppVersion } from './interface';

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

  @endpoint()
  async requestNotifications(observer: RPC.Node<IAppObserver>) {
    console.log('calling onAppSomething');
    const a = new AppMainVersion(this.channel);
    const { AppNodeVersion } = await import('./node');
    a.connect(AppNodeVersion);
    observer.onAppSomething(a);
    return () => {}; // unsubscribe
  }
}

@service('app:version')
export class AppMainVersion extends ObserverService implements RPC.Node<IAppVersion> {

  @endpoint()
  async getVersion() {
    return app.getVersion();
  }
}

@service('app:observer')
export class AppMainObserver extends ObserverService implements RPC.Node<IAppObserver> {

  @notify
  onAppSomething: RPC.Node<IAppObserver>['onAppSomething'];
}
