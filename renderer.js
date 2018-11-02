const { ipcRenderer } = require('electron');

setTimeout(() => {
  document.querySelector('webview').openDevTools();
}, 2000);

const stopStressBtn = document.querySelector('.stop-stress');
const startStressSimpleBtn = document.querySelector('.start-stress-simple');
const startStressForkBtn = document.querySelector('.start-stress-fork');

stopStressBtn.addEventListener('click', () => {
  ipcRenderer.send('stop-stress');
});

startStressSimpleBtn.addEventListener('click', () => {
  stopStressBtn.setAttribute('disabled', 'disabled');
  ipcRenderer.send('start-stress-simple');
});

startStressForkBtn.addEventListener('click', () => {
  ipcRenderer.send('start-stress-fork');
});

ipcRenderer.on('stress-started', () => {
  stopStressBtn.removeAttribute('disabled');
  startStressSimpleBtn.setAttribute('disabled', 'disabled');
  startStressForkBtn.setAttribute('disabled', 'disabled');
});

ipcRenderer.on('stress-stopped', () => {
  stopStressBtn.setAttribute('disabled', 'disabled');
  startStressSimpleBtn.removeAttribute('disabled');
  startStressForkBtn.removeAttribute('disabled');
});
