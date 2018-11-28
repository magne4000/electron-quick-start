import { app } from 'electron';
import { endpoint, request, service, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

@service('app')
export class AppNode extends Service implements RPC.Node<IApp> {

  @request
  getName: RPC.Node<IApp>['getName'];

  @request
  askGetValuePlusOne: RPC.Node<IApp>['askGetValuePlusOne'];

  @endpoint('plusone')
  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}
