export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<Array<{ path: string; name: string; content: string }> | null>;
    };
  }
}
