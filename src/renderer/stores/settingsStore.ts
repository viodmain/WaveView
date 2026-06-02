import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../../shared/types';

interface SettingsStore extends AppSettings {
  zoomMode: boolean;
  resetCounter: number; // Incremented to trigger reset on all plot windows
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
  setZoomMode: (zoom: boolean) => void;
  triggerReset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 14,
      zoomMode: false,
      resetCounter: 0,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize: Math.max(10, Math.min(20, fontSize)) }),
      setZoomMode: (zoomMode) => set({ zoomMode }),
      triggerReset: () => set((state) => ({ resetCounter: state.resetCounter + 1 })),
    }),
    {
      name: 'waveview-settings',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        zoomMode: state.zoomMode,
      }),
    }
  )
);
