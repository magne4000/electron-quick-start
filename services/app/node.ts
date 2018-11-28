import { app } from 'electron';
import { method, request, Service } from '../utils';
import { IAppGgetValuePlusOneParams, IAppNode } from './interface';

export class AppNode extends Service('app') implements RPC.Node<IAppNode> {

  @request
  getName() {
    return this.peer.request('app:getName');
  }

  @request
  askGetValuePlusOne(params: IAppGgetValuePlusOneParams) {
    return this.peer.request('app:askGetValuePlusOne', params);
  }

  @method('plusone')
  async getValuePlusOne({ value }: IAppGgetValuePlusOneParams) {
    return value + 1;
  }
}
