export type IAppGgetValuePlusOneParams = {value: number};

export interface IApp extends RPC.Interface<IApp> {
  getName: () => string;
  getValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
  askGetValuePlusOne: (params: IAppGgetValuePlusOneParams) => number;
}
