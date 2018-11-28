import { app } from 'electron';
import { method, request, Service } from '../utils';
import { IApp, IAppGgetValuePlusOneParams } from './interface';

export class AppNode extends Service('app') implements RPC.Node<IApp> {

  @request
  getName(): any {}

  @request
  askGetValuePlusOne(): any {}

  @method('plusone')
  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}
