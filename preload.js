const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eliteBridge', {
  state: s => ipcRenderer.send('state', s),
  mode: m => ipcRenderer.send('mode', m),
  onCmd: cb => ipcRenderer.on('cmd', (e, c) => cb(c))
});
