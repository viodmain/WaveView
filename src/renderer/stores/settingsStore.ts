import { create } from 'zustand';
import { AppSettings } from '../../shared/types';

interface SettingsStore extends AppSettings {
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'light',
  fontSize: 14,
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
