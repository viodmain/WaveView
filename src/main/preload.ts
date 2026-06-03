import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  onFileOpened: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-opened', (_event, filePath) => callback(filePath));
  },
});
