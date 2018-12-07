import { ipcRenderer } from 'electron';
import rpcchannel from 'stream-json-rpc';
import { AppService, AppVersionService } from '../services/app/main';
import { AppObserver } from '../services/app/node';
import { registry } from '../services/utils';
import { RendererDuplex } from './helpers';

registry.add(AppObserver);
registry.add(AppVersionService);

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
  const getRequestNotificationsBtn = document.querySelector('#notify-btn');
  const getRequestNotificationsSpan = document.querySelector('#notify-span');
  const getVersionBtn = document.querySelector('#version-btn');
  const getVersionSpan = document.querySelector('#version-span');

  // const appservice = new AppNode(channel);
  const appservice = new AppService.Node(channel, '__default__');
  const observer = new AppObserver(channel);

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await appservice.getName();
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
