import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppNode, AppNodeObserver, AppNodeVersion } from '../services/app/node';
import { registry } from '../services/utils';
import { RendererDuplex } from './helpers';

registry.add(AppNode);
registry.add(AppNodeVersion);
registry.add(AppNodeObserver);

const channel = rpcchannel(new RendererDuplex());

const init = () => {
  const mainPeer = channel.peer('dummy');
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
  const getRequestNotificationsBtn = document.querySelector('#notify-btn');
  const getRequestNotificationsSpan = document.querySelector('#notify-span');
  const getVersionBtn = document.querySelector('#version-btn');
  const getVersionSpan = document.querySelector('#version-span');

  const appservice = new AppNode(channel);
  const observer = new AppNodeObserver(channel);
  // Dynamic import to avoid circular deps
  import('../services/app/main').then(({ AppMain, AppMainObserver }) => {
    appservice.connect(AppMain);
    observer.connect(AppMainObserver);
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

  getRequestNotificationsBtn.addEventListener('click', async () => {
    getRequestNotificationsSpan.innerHTML = 'waiting...';
    appservice.requestNotifications(observer);
    getRequestNotificationsSpan.innerHTML = 'notifications requested, you can now click on version';
  });

  getVersionBtn.addEventListener('click', async () => {
    getVersionSpan.innerHTML = 'waiting...';
    if (!observer.appVersion) {
      getVersionSpan.innerHTML = 'appVersion not set. Click on requestNotifications button.';
    } else {
      getVersionSpan.innerHTML = await observer.appVersion.getVersion();
    }
  });
};

initGetName();
initAppService();
