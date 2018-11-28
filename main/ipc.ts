import Peer from '@magne4000/json-rpc-peer';
import { app, ipcMain } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppMain } from '../services/app/main';
import { MainDuplex } from './helpers';

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
  const appMain = new AppMain(peer);
  // Dynamic import to avoid circular deps
  import('../services/app/node').then(({ AppNode }) => {
    appMain.connect(channel, AppNode);
  });
};
