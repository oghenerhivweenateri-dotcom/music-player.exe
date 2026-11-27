const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path'), fs = require('fs');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (!app.requestSingleInstanceLock()) app.quit();
let win, isl, mode = 'min', last = null;
const posFile = () => path.join(app.getPath('userData'), 'island.json');

function update() {
  if (!isl || isl.isDestroyed() || !win || win.isDestroyed()) return;
  const away = win.isMinimized() || !win.isVisible() || (mode === 'blur' && !win.isFocused());
  if (mode !== 'never' && away) isl.showInactive(); else isl.hide();
}

function create() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600, backgroundColor: '#0d0f14', title: 'Elite Studio', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  win.loadFile('index.html');
  const wa = screen.getPrimaryDisplay().workArea;
  let pos = { x: wa.x + Math.round((wa.width - 480) / 2), y: wa.y };
  try { pos = JSON.parse(fs.readFileSync(posFile(), 'utf8')); } catch (e) {}
  isl = new BrowserWindow({
    width: 480, height: 260, x: pos.x, y: pos.y, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false,
    focusable: false, show: false, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'island-preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  isl.setAlwaysOnTop(true, 'screen-saver');
  isl.setIgnoreMouseEvents(true, { forward: true });
  isl.loadFile('island.html');
  isl.webContents.on('did-finish-load', () => { if (last) isl.webContents.send('state', last); });
  ['minimize', 'restore', 'focus', 'blur', 'show', 'hide'].forEach(ev => win.on(ev, update));
  win.on('closed', () => app.quit());
}

ipcMain.on('state', (e, s) => { last = s; if (isl && !isl.isDestroyed()) isl.webContents.send('state', s); });
ipcMain.on('cmd', (e, c) => { if (win && !win.isDestroyed()) win.webContents.send('cmd', c); });
ipcMain.on('mode', (e, m) => { mode = m; update(); });
ipcMain.on('mouse', (e, ignore) => { if (isl && !isl.isDestroyed()) isl.setIgnoreMouseEvents(ignore, { forward: true }); });
ipcMain.on('move', (e, dx, dy) => { if (isl && !isl.isDestroyed()) { const [x, y] = isl.getPosition(); isl.setPosition(x + dx, y + dy); } });
ipcMain.on('savepos', () => { try { const [x, y] = isl.getPosition(); fs.writeFileSync(posFile(), JSON.stringify({ x, y })); } catch (e) {} });
ipcMain.on('openapp', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
