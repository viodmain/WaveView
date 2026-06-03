export interface ElectronAPI {
  openFileDialog: () => Promise<string[] | null>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; filename?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
