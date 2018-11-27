import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppNode } from '../services/app/node';
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

const initGetName2 = () => {
  const getNameBtn = document.querySelector('#getname2-btn');
  const getNameSpan = document.querySelector('#getname2-span');
  const appservice = new AppNode(peer);

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await appservice.getName();
  });
};

initGetName();
initGetName2();
