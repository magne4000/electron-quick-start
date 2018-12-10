import { app } from 'electron';
import { getNode, observer, service, ServiceSimple } from '../utils';
import { IApp, IAppObserver, IAppVersion } from './interface';

@service('app')
export class AppService extends ServiceSimple<AppService> implements RPC.Node<IApp> {
  async getName() {
    return app.getName();
  }

  async requestNotifications(o: RPC.Node<IAppObserver>) {
    console.log('calling onAppSomething');
    const a = new AppVersionService(this.channel);
    o.onAppVersionSimple({ appVersion: await a.getVersion() });
    o.onAppVersion(a);

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
