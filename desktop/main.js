import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = app.isPackaged ? 38558 : 3000;
process.env.PORT = PORT.toString();
process.env.DESKTOP_APP = '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1120,
    minHeight: 720,
    title: "PARSER by FRESKO CT",
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  let retries = 0;
  const checkServerAndLoad = () => {
    fetch(`http://127.0.0.1:${PORT}`)
      .then(() => {
        win.loadURL(`http://127.0.0.1:${PORT}/?desktop=1`);
        if (!app.isPackaged) {
          win.webContents.openDevTools();
        }
      })
      .catch((err) => {
        retries++;
        if (retries > 10) {
          try {
            dialog.showErrorBox("Failed to start interface", `The server at http://127.0.0.1:${PORT} didn't respond. Error: ` + String(err));
            app.quit();
          } catch(e) {}
        } else {
          setTimeout(checkServerAndLoad, 500);
        }
      });
  };
  
  checkServerAndLoad();
}

app.whenReady().then(async () => {
    process.env.NODE_ENV = 'production';
    try {
      await import('../dist-server/server.js');
    } catch (e) {
      console.error("Server init error:", e);
      // dialog.showErrorBox("Server Error", String(e.stack || e));
      
      const { spawn } = await import('child_process');
      serverProcess = spawn('npx', ['tsx', 'web/server.ts'], { shell: true });
    }
  
    createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
