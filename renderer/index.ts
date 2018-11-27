import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { RendererDuplex } from './helpers';

const init = () => {
  const channel = rpcchannel();
  const mainPeer = channel.connect(new RendererDuplex());
  ipcRenderer.send('socket.connected', 'renderer1');
  return mainPeer;
};

const peer = init();

const initGetName = () => {
  const getNameBtn = document.querySelector('#getname-btn');
  const getNameSpan = document.querySelector('#getname-span');

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await peer.request('getName');
  });
};

initGetName();
