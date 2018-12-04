import { app, ipcMain } from 'electron';
import rpcchannel, { RPCChannel } from 'stream-json-rpc';
import { AppMain, AppMainObserver, AppMainVersion } from '../services/app/main';
import { registry } from '../services/utils';
import { MainDuplex } from './helpers';

registry.add(AppMain);
registry.add(AppMainVersion);
registry.add(AppMainObserver);

export const init = () => {
  return new Promise((resolve) => {
    ipcMain.on('socket.connected', (event: any) => {
      const channel = rpcchannel(new MainDuplex(event.sender));

      const peer = channel.peer('dummy');
      peer.setRequestHandler('getName', () => {
        return app.getName();
      });
      resolve(channel);
    });
  });
};

export const init2 = (channel: RPCChannel) => {
  const appMain = new AppMain(channel);
  // Dynamic import to avoid circular deps
  import('../services/app/node').then(({ AppNode }) => {
    appMain.connect(AppNode);
  });
};
