import { Menu, MenuItemConstructorOptions, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export function createMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'SPICE Files', extensions: ['tr0', 'tr1', 'tr2', 'ac0', 'ac1', 's1p', 's2p', 's3p', 's4p'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const files = await Promise.all(
                result.filePaths.map(async (filePath) => {
                  const stat = await fs.promises.stat(filePath);
                  if (stat.size > MAX_FILE_SIZE) {
                    throw new Error(`File ${path.basename(filePath)} is too large (${Math.round(stat.size / 1024 / 1024)}MB)`);
                  }
                  const content = await fs.promises.readFile(filePath, 'utf-8');
                  return {
                    path: filePath,
                    name: path.basename(filePath),
                    content,
                  };
                })
              );
              mainWindow.webContents.send('files:opened', files);
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Theme',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('theme:toggle');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About WaveView',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About WaveView',
              message: 'WaveView v1.0.0',
              detail: 'A waveform viewer for SPICE simulation files.\n\nSupports .tr0, .ac0, .s*p formats.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}
