import { app, ipcMain } from 'electron';
import rpcchannel, { RPCChannel } from 'stream-json-rpc';
import { AppService, AppVersionService } from '../services/app/main';
import { AppObserver } from '../services/app/node';
import { registry } from '../services/utils';
import { MainDuplex } from './helpers';

registry.add(AppService);
registry.add(AppVersionService);
registry.add(AppObserver);

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
  const appMain = new AppService(channel, '__default__');
};
