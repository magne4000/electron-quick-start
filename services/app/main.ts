import { app } from 'electron';
import { getNode, service, ServiceBase } from '../utils';
import { IApp, IAppObserver, IAppVersion } from './interface';

@service('app')
export class AppService extends ServiceBase implements RPC.Node<IApp> {
  async getName() {
    return app.getName();
  }

  async requestNotifications(o: RPC.Node<IAppObserver>) {
    console.log('calling requestNotifications');
    const a = new AppVersionService();
    o.onAppVersionSimple({ appVersion: await a.getVersion() });
    o.onAppVersion(a);

    return () => {}; // unsubscribe
  }

  static get Node(): typeof AppService {
    return getNode(this);
  }
}

@service('app:version')
export class AppVersionService extends ServiceBase implements RPC.Node<IAppVersion> {

  async getVersion() {
    return app.getVersion();
  }

  static get Node(): typeof AppVersionService {
    return getNode(this);
  }
}
