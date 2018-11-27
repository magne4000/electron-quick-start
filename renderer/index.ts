import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { bindImpl } from '../services/app/main';
import { AppNode } from '../services/app/node';
import { RendererDuplex } from './helpers';

const channel = rpcchannel();

const init = () => {
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

const initAppService = () => {
  const getNameBtn = document.querySelector('#getname2-btn');
  const getNameSpan = document.querySelector('#getname2-span');
  const getValuePlusOneBtn = document.querySelector('#getvalueplusone-btn');
  const getValuePlusOneInput = document.querySelector<HTMLInputElement>('#getvalueplusone-input');
  const getValuePlusOneSpan = document.querySelector('#getvalueplusone-span');

  const appservice = new AppNode(peer);
  bindImpl(channel, appservice);

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await appservice.getName();
  });

  getValuePlusOneBtn.addEventListener('click', async () => {
    const value = parseInt(getValuePlusOneInput.value, 10);
    getValuePlusOneSpan.innerHTML = 'waiting...';
    getValuePlusOneSpan.innerHTML = await appservice.askGetValuePlusOne({ value });
  });
};

initGetName();
initAppService();
