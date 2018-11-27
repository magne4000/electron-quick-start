import { Duplex } from 'stream';
import { ipcRenderer } from 'electron';

export class RendererDuplex extends Duplex {
  constructor() {
    super();
    ipcRenderer.on('data', (_: any, data: any) => {
      this.push(data);
    });
  }

  // tslint:disable-next-line
  _write(chunk: any, _encoding: any, callback: any) {
    ipcRenderer.send('data', chunk.toString());
    callback();
  }

  // tslint:disable-next-line
  _read(_size: any) {}
}
