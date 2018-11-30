import { Duplex } from 'stream';
import { ipcRenderer } from 'electron';

export class RendererDuplex extends Duplex {

  constructor() {
    super();
    ipcRenderer.on('data', (_: any, data: Uint8Array) => {
      this.push(data);
    });
  }

  // tslint:disable-next-line
  _write(chunk: any, _encoding: any, callback: any) {
    ipcRenderer.send('data', new Uint8Array(chunk));
    callback();
  }

  // tslint:disable-next-line
  _read(_size: any) {}
}
