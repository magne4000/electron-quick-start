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
const srvcPeerHandler = new ServicePeerHandler(channel, true);

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
  const getRequestNotificationsBtn2 = document.querySelector('#notify2-btn');
  const getRequestNotificationsSpan2 = document.querySelector('#notify2-span');
  const getDebugBtn = document.querySelector('#debug-btn');

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
    await appservice.requestNotifications(obs);
    getRequestNotificationsSpan.innerHTML = 'notifications requested, see console';
  });

  getRequestNotificationsBtn2.addEventListener('click', async () => {
    getRequestNotificationsSpan2.innerHTML = 'waiting...';
    await appservice.requestNotifications(channelObserver(
      {
        onAppVersion: (appVersion: RPC.Node<IAppVersion>) => {
          appVersion.getVersion().then((v) => {
            console.log('appVersion2 retrieved', v);
          });
        },
        onAppVersionSimple: ({ appVersion }: { appVersion: string }) => {
          console.log('appVersionSimple2 retrieved', appVersion);
        },
      }
    ));
    getRequestNotificationsSpan2.innerHTML = 'notifications requested, see console';
  });

  getDebugBtn.addEventListener('click', () => {
    srvcPeerHandler.debug.dump();
  });
};

initGetName();
initAppService();
