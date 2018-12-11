import { app } from 'electron';
import { service, ServiceBase } from '../utils';
import { IAppObserver, IAppVersion } from './interface';

@service('app:observer', { observer: true })
export class AppObserver extends ServiceBase implements RPC.Node<IAppObserver> {

  appVersion: RPC.Node<IAppVersion>;

  async onAppVersion(appVersion: RPC.Node<IAppVersion>) {
    this.appVersion = appVersion;
    console.log('appVersion retrieved', await appVersion.getVersion());
  }

  async onAppVersionSimple({ appVersion }: { appVersion: string }) {
    console.log('appVersionSimple retrieved', appVersion);
  }
}
