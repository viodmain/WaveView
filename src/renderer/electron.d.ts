export interface ElectronAPI {
  openFileDialog: () => Promise<string[] | null>;
  onFileOpened: (callback: (filePath: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
