import { app } from 'electron';
import { getNode, service, ServiceSimple } from '../utils';
import { IApp, IAppObserver, IAppVersion } from './interface';

@service('app')
export class AppService extends ServiceSimple<AppService> implements RPC.Node<IApp> {
  async getName() {
    return app.getName();
  }

  async requestNotifications(observer: RPC.Node<IAppObserver>) {
    console.log('calling onAppSomething');
    const a = new AppVersionService(this.channel);
    // TODO
    // observer.onAppSomething({ getVersion() { return 1 } });
    observer.onAppVersionSimple({ appVersion: await a.getVersion() });
    observer.onAppVersion(a);

    return () => {}; // unsubscribe
  }

  static get Node(): typeof AppService {
    return getNode(this);
  }
}

@service('app:version')
export class AppVersionService extends ServiceSimple<AppVersionService> implements RPC.Node<IAppVersion> {

  async getVersion() {
    return app.getVersion();
  }

  static get Node(): typeof AppVersionService {
    return getNode(this);
  }
}
