import { app, ipcMain } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppService, AppVersionService } from '../services/app/main';
import { AppObserver } from '../services/app/node';
import { registry, ServicePeerHandler } from '../services/utils';
import { MainDuplex } from './helpers';

registry.add(AppService);
registry.add(AppVersionService);
registry.add(AppObserver);

export const init = () => {
  return new Promise((resolve) => {
    ipcMain.on('socket.connected', (event: any) => {
      const channel = rpcchannel(new MainDuplex(event.sender));
      const srvcPeerHandler = new ServicePeerHandler(channel);

      const peer = channel.peer('dummy');
      peer.setRequestHandler('getName', () => {
        return app.getName();
      });
      resolve(srvcPeerHandler);
    });
  });
};

export const init2 = (srvcPeerHandler: ServicePeerHandler) => {
  const appMain = new AppService('__default__');
  srvcPeerHandler.connect(appMain);
};
