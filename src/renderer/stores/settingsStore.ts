import { create } from 'zustand';

export type AxisScale = 'linear' | 'log';

interface SettingsStore {
  theme: 'dark' | 'light';
  fontSize: number;
  xAxisScale: AxisScale;
  yAxisScale: AxisScale;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
  setXAxisScale: (scale: AxisScale) => void;
  setYAxisScale: (scale: AxisScale) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  fontSize: 13,
  xAxisScale: 'linear',
  yAxisScale: 'linear',
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setXAxisScale: (xAxisScale) => set({ xAxisScale }),
  setYAxisScale: (yAxisScale) => set({ yAxisScale }),
}));
