export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<Array<{ path: string; name: string; content: string }> | null>;
      onFilesOpened: (callback: (files: Array<{ path: string; name: string; content: string }>) => void) => void;
      onThemeToggle: (callback: () => void) => void;
    };
  }
}
