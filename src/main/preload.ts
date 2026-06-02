import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  onFilesOpened: (callback: (files: Array<{ path: string; name: string; content: string }>) => void) => {
    ipcRenderer.on('files:opened', (_event, files) => callback(files));
  },
  onThemeToggle: (callback: () => void) => {
    ipcRenderer.on('theme:toggle', () => callback());
  },
});
