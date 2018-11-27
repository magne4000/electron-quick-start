export interface IApp extends RPC.Interface<IApp> {
  getName: () => string;
}
