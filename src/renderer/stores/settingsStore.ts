import { create } from 'zustand';

interface SettingsStore {
  theme: 'dark' | 'light';
  fontSize: number;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  fontSize: 13,
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
