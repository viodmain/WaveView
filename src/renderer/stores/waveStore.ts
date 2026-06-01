import { create } from 'zustand';
import { PlotWindow } from '../../shared/types';

interface WaveStore {
  windows: PlotWindow[];
  activeWindowId: string | null;
  addWindow: () => void;
  removeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  toggleWave: (windowId: string, filename: string, waveName: string) => void;
}

let windowCounter = 0;

export const useWaveStore = create<WaveStore>((set) => ({
  windows: [],
  activeWindowId: null,
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
      return {
        windows: newWindows,
        activeWindowId:
          state.activeWindowId === id
            ? newWindows[0]?.id ?? null
            : state.activeWindowId,
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
}));
