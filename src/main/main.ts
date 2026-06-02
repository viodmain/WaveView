import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Max file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'SPICE Files', extensions: ['tr0', 'tr1', 'tr2', 'ac0', 'ac1', 's1p', 's2p', 's3p', 's4p'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return null;
  }

  // Read file contents with size check
  const files = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const stat = await fs.promises.stat(filePath);
      if (stat.size > MAX_FILE_SIZE) {
        throw new Error(`File ${path.basename(filePath)} is too large (${Math.round(stat.size / 1024 / 1024)}MB, max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        path: filePath,
        name: path.basename(filePath),
        content,
      };
    })
  );

  return files;
});
