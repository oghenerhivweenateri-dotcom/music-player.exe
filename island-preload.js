const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('islBridge', {
  onState: cb => ipcRenderer.on('state', (e, s) => cb(s)),
  cmd: (t, v) => ipcRenderer.send('cmd', { t, v }),
  mouse: i => ipcRenderer.send('mouse', i),
  move: (dx, dy) => ipcRenderer.send('move', dx, dy),
  savepos: () => ipcRenderer.send('savepos'),
  open: () => ipcRenderer.send('openapp')
});
