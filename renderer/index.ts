import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppNode } from '../services/app/node';
import { RendererDuplex } from './helpers';

const channel = rpcchannel(new RendererDuplex());

const init = () => {
  const mainPeer = channel.peer();
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

const initAppService = () => {
  const getNameBtn = document.querySelector('#getname2-btn');
  const getNameSpan = document.querySelector('#getname2-span');
  const getValuePlusOneBtn = document.querySelector('#getvalueplusone-btn');
  const getValuePlusOneInput = document.querySelector<HTMLInputElement>('#getvalueplusone-input');
  const getValuePlusOneSpan = document.querySelector('#getvalueplusone-span');

  const appservice = new AppNode(peer);
  // Dynamic import to avoid circular deps
  import('../services/app/main').then(({ AppMain }) => {
    appservice.connect(AppMain);
  });

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await appservice.getName();
  });

  getValuePlusOneBtn.addEventListener('click', async () => {
    const value = parseInt(getValuePlusOneInput.value, 10);
    getValuePlusOneSpan.innerHTML = 'waiting...';
    getValuePlusOneSpan.innerHTML = String(await appservice.askGetValuePlusOne({ value }));
  });
};

initGetName();
initAppService();
