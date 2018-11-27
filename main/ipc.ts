import { ipcMain, app } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppMain, bindImpl } from '../services/app/main';
import { MainDuplex } from './helpers';

const channel = rpcchannel();

export const init = () => {
  ipcMain.on('socket.connected', (event: any) => {
    channel.connect(new MainDuplex(event.sender));
  });

  channel.setRequestHandler('getName', () => {
    return app.getName();
  });
};

export const init2 = () => {
  bindImpl(channel, new AppMain());
};
