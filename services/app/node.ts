import { app } from 'electron';
import { endpoint, request, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppNode extends Service('app') implements RPC.Node<IApp> {

  @request
  getName: RPC.Node<IApp>['getName'];

  @request
  askGetValuePlusOne: RPC.Node<IApp>['askGetValuePlusOne'];

  @endpoint('plusone')
  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}
