export type IAppGgetValuePlusOneParams = {value: number};

export interface IApp extends RPC.Interface<IApp> {
  getName: () => string;
  getValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
}

export interface IAppNode extends IApp, RPC.Interface<IAppNode> {
  askGetValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
}
