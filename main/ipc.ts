import { ipcMain, app } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { MainDuplex } from './helpers';

export const init = () => {
  const channel = rpcchannel();

  ipcMain.on('socket.connected', (event: any) => {
    channel.connect(new MainDuplex(event.sender));
  });

  channel.setRequestHandler('getName', () => {
    return app.getName();
  });
};
