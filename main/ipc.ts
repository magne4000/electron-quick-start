import { app, ipcMain } from 'electron';
import rpcchannel, { RPCChannelPeer } from 'stream-json-rpc';
import { AppMain } from '../services/app/main';
import { MainDuplex } from './helpers';

export const init = () => {
  return new Promise((resolve) => {
    ipcMain.on('socket.connected', (event: any) => {
      const channel = rpcchannel(new MainDuplex(event.sender));

      const peer = channel.peer();
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
