import { create } from 'zustand';
import { PlotWindow } from '../../shared/types';

interface XAxisRange {
  min: number;
  max: number;
}

interface WaveStore {
  windows: PlotWindow[];
  activeWindowId: string | null;
  sharedXRange: XAxisRange | null; // Shared x-axis range across windows
  syncEnabled: boolean; // Whether cross-window sync is active
  addWindow: () => void;
  removeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  toggleWave: (windowId: string, filename: string, waveName: string) => void;
  clearWaves: (windowId: string) => void;
  updateSharedXRange: (range: XAxisRange | null) => void;
  setSyncEnabled: (enabled: boolean) => void;
}

let windowCounter = 0;

export const useWaveStore = create<WaveStore>((set) => ({
  windows: [],
  activeWindowId: null,
  sharedXRange: null,
  syncEnabled: true,
  addWindow: () =>
    set((state) => {
      const id = `window-${++windowCounter}`;
      const newWindow: PlotWindow = {
        id,
        title: `Window ${windowCounter}`,
        waves: [],
      };
      return {
        windows: [...state.windows, newWindow],
        activeWindowId: id,
      };
    }),
  removeWindow: (id) =>
    set((state) => {
      const newWindows = state.windows.filter((w) => w.id !== id);
      // Clear shared range if no windows left
      return {
        windows: newWindows,
        activeWindowId:
          state.activeWindowId === id
            ? newWindows[0]?.id ?? null
            : state.activeWindowId,
        sharedXRange: newWindows.length === 0 ? null : state.sharedXRange,
      };
    }),
  setActiveWindow: (id) => set({ activeWindowId: id }),
  toggleWave: (windowId, filename, waveName) =>
    set((state) => {
      const newWindows = state.windows.map((w) => {
        if (w.id !== windowId) return w;
        const exists = w.waves.some(
          (wave) => wave.filename === filename && wave.waveName === waveName
        );
        return {
          ...w,
          waves: exists
            ? w.waves.filter(
                (wave) =>
                  !(wave.filename === filename && wave.waveName === waveName)
              )
            : [...w.waves, { filename, waveName }],
        };
      });
      return { windows: newWindows };
    }),
  clearWaves: (windowId) =>
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== windowId) return w;
        return { ...w, waves: [] };
      }),
    })),
  updateSharedXRange: (range) => set({ sharedXRange: range }),
  setSyncEnabled: (enabled) => set({ syncEnabled: enabled, sharedXRange: enabled ? null : null }),
}));
