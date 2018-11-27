import { app } from 'electron';
import { IApp } from './interface';

export class AppNode implements RPC.Client<IApp> {
  peer: any;

  getName() {
    return this.peer.request('getName');
  }
}
