import { app, ipcMain } from 'electron';
import rpcchannel, { RPCChannelPeer } from 'stream-json-rpc';
import { AppMain } from '../services/app/main';
import { MainDuplex } from './helpers';

const channel = rpcchannel();

export const init = () => {
  return new Promise((resolve) => {
    ipcMain.on('socket.connected', (event: any) => {
      const peer = channel.connect(new MainDuplex(event.sender));
      peer.setRequestHandler('getName', () => {
        return app.getName();
      });
      resolve(peer);
    });
  });
};

export const init2 = (peer: RPCChannelPeer) => {
  const appMain = new AppMain(peer);
  // Dynamic import to avoid circular deps
  import('../services/app/node').then(({ AppNode }) => {
    appMain.connect(AppNode);
  });
};
