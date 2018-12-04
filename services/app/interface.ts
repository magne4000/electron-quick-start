export type IAppGgetValuePlusOneParams = {value: number};
export type Subscription = () => void;

export interface IApp extends RPC.Interface<IApp> {
  getName: () => string;
  getValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
  askGetValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
  requestNotifications: (observer: IAppObserver) => Subscription;
}

export interface IAppVersion extends RPC.Interface<IAppVersion> {
  getVersion: () => string;
}

export interface IAppObserver extends RPC.Interface<IAppObserver> {
  onAppSomething: (appVersion: RPC.Node<IAppVersion>) => void;
}
