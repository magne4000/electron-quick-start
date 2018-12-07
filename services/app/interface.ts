export type IAppGgetValuePlusOneParams = {value: number};
export type Subscription = () => void;

export interface IApp extends RPC.Interface<IApp> {
  getName: () => string;
  requestNotifications: (observer: IAppObserver) => Subscription;
}

export interface IAppVersion extends RPC.Interface<IAppVersion> {
  getVersion: () => string;
}

export interface IAppObserver extends RPC.Interface<IAppObserver> {
  onAppVersion: (appVersion: RPC.Node<IAppVersion>) => void;
  onAppVersionSimple: (x: { appVersion: string }) => void;
}
