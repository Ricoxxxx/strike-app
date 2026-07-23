const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('license-activation.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- Auto-updater logging — every stage now actually reports what's
// happening, both to the terminal and to the app's own DevTools console,
// instead of failing/succeeding silently with nothing to look at. ----

function logToApp(msg) {
  console.log(msg);
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(
      `console.log(${JSON.stringify('[updater] ' + msg)})`
    ).catch(() => {});
  }
}

autoUpdater.on('checking-for-update', () => {
  logToApp('Checking for update…');
});

autoUpdater.on('update-available', (info) => {
  logToApp('Update available: v' + info.version + ' — downloading now.');
});

autoUpdater.on('update-not-available', (info) => {
  logToApp('No update available. Current app is already the latest (v' + app.getVersion() + ').');
});

autoUpdater.on('error', (err) => {
  logToApp('Auto-update ERROR: ' + err.message);
});

autoUpdater.on('download-progress', (progress) => {
  logToApp('Downloading update: ' + Math.round(progress.percent) + '%');
});

autoUpdater.on('update-downloaded', (info) => {
  logToApp('Update v' + info.version + ' downloaded — will install on next restart.');
});

// ---- Real filesystem access (unrelated to updates) ----

ipcMain.handle('list-xml-files', async (event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath);
    const xmlFiles = entries.filter((f) => f.toLowerCase().endsWith('.xml'));
    return { ok: true, files: xmlFiles };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('read-text-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('write-text-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});