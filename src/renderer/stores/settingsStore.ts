import { create } from 'zustand';

export type AxisScale = 'linear' | 'log';

interface SettingsStore {
  theme: 'dark' | 'light';
  fontSize: number;
  xAxisScale: AxisScale;
  yAxisScale: AxisScale;
  downsampleEnabled: boolean;
  downsampleThreshold: number;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
  setXAxisScale: (scale: AxisScale) => void;
  setYAxisScale: (scale: AxisScale) => void;
  setDownsampleEnabled: (enabled: boolean) => void;
  setDownsampleThreshold: (threshold: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  fontSize: 13,
  xAxisScale: 'linear',
  yAxisScale: 'linear',
  downsampleEnabled: true,
  downsampleThreshold: 5000,
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setXAxisScale: (xAxisScale) => set({ xAxisScale }),
  setYAxisScale: (yAxisScale) => set({ yAxisScale }),
  setDownsampleEnabled: (downsampleEnabled) => set({ downsampleEnabled }),
  setDownsampleThreshold: (downsampleThreshold) => set({ downsampleThreshold }),
}));
