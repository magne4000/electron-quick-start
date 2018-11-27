import { ipcMain, app } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppMain} from '../services/app/main';
import { bindImpl } from '../services/app/node';
import { MainDuplex } from './helpers';
import Peer from '@magne4000/json-rpc-peer';

const channel = rpcchannel();

export const init = () => {
  return new Promise((resolve) => {
    ipcMain.on('socket.connected', (event: any) => {
      resolve(channel.connect(new MainDuplex(event.sender)));
    });

    channel.setRequestHandler('getName', () => {
      return app.getName();
    });
  });
};

export const init2 = (peer: Peer) => {
  bindImpl(channel, new AppMain(peer));
};
