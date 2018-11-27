import Peer from '@magne4000/json-rpc-peer';
import { app } from 'electron';
import { IApp } from './interface';

export class AppNode implements RPC.Client<IApp> {
  peer: Peer;

  constructor(peer: Peer) {
    this.peer = peer;
  }

  getName() {
    return this.peer.request('app:getName');
  }
}
