import { ipcMain } from 'electron';
import { Duplex } from 'stream';

export class MainDuplex extends Duplex {
  webContents: Electron.WebContents;

  constructor(webContents: Electron.WebContents) {
    super();
    this.webContents = webContents;
    ipcMain.on('data', (_: any, data: Uint8Array) => {
      this.push(data);
    });
  }

  // tslint:disable-next-line
  _write(chunk: any, _encoding: any, callback: any) {
    this.webContents.send('data', new Uint8Array(chunk));
    callback();
  }

  // tslint:disable-next-line
  _read(_size: any) {}
}
