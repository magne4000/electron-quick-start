import { ipcRenderer } from 'electron';
import rpcchannel, { RPCChannel } from 'stream-json-rpc';
import { IAppVersion } from '../services/app/interface';
import { AppService, AppVersionService } from '../services/app/main';
import { AppObserver } from '../services/app/node';
import { observer, registry, ServicePeerHandler } from '../services/utils';
import { RendererDuplex } from './helpers';

registry.add(AppObserver);
registry.add(AppVersionService);

const channel: RPCChannel = rpcchannel(new RendererDuplex());
const srvcPeerHandler = new ServicePeerHandler(channel);

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
  const appservice = new AppService.Node('__default__');
  srvcPeerHandler.connect(appservice);
  const obs = new AppObserver();
  srvcPeerHandler.connect(obs);
  const channelObserver = observer(srvcPeerHandler);

  getNameBtn.addEventListener('click', async () => {
    getNameSpan.innerHTML = 'waiting...';
    getNameSpan.innerHTML = await appservice.getName();
  });

  getRequestNotificationsBtn.addEventListener('click', async () => {
    getRequestNotificationsSpan.innerHTML = 'waiting...';
    // appservice.requestNotifications(observer);
    appservice.requestNotifications(channelObserver(
      {
        onAppVersion: (appVersion: RPC.Node<IAppVersion>) => {
          appVersion.getVersion().then((v) => {
            console.log('appVersion retrieved', v);
          });
        },
        onAppVersionSimple: ({ appVersion }: { appVersion: string }) => {
          console.log('appVersionSimple retrieved', appVersion);
        },
      }
    ));
    getRequestNotificationsSpan.innerHTML = 'notifications requested, you can now click on version';
  });

  getVersionBtn.addEventListener('click', async () => {
    getVersionSpan.innerHTML = 'waiting...';
    if (!obs.appVersion) {
      getVersionSpan.innerHTML = 'appVersion not set. Click on requestNotifications button.';
    } else {
      getVersionSpan.innerHTML = await obs.appVersion.getVersion();
    }
  });
};

initGetName();
initAppService();
