import { create } from 'zustand';

export interface PlotWindow {
  id: string;
  title: string;
  selectedWaves: Set<string>; // "filename::waveName" 格式
}

interface WindowStore {
  windows: PlotWindow[];
  activeWindowId: string | null;
  createWindow: () => void;
  closeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  toggleWave: (windowId: string, waveKey: string) => void;
  clearWaves: (windowId: string) => void;
}

// 使用计数器生成唯一 id，从 2 开始（1 已被初始窗口使用）
let nextId = 2;

function generateId(): string {
  return `window-${nextId++}`;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [
    {
      id: 'window-1',
      title: 'Plot 1',
      selectedWaves: new Set(),
    },
  ],
  activeWindowId: 'window-1',

  createWindow: () => {
    const id = generateId();
    const windowNum = get().windows.length + 1;
    set((state) => ({
      windows: [
        ...state.windows,
        {
          id,
          title: `Plot ${windowNum}`,
          selectedWaves: new Set(),
        },
      ],
      activeWindowId: id,
    }));
  },

  closeWindow: (id) => {
    set((state) => {
      const newWindows = state.windows.filter((w) => w.id !== id);
      // 如果关闭的是当前活跃窗口，切换到第一个窗口
      const newActiveId =
        state.activeWindowId === id
          ? newWindows[0]?.id ?? null
          : state.activeWindowId;
      return {
        windows: newWindows,
        activeWindowId: newActiveId,
      };
    });
  },

  setActiveWindow: (id) => {
    set({ activeWindowId: id });
  },

  toggleWave: (windowId, waveKey) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== windowId) return w;
        const next = new Set(w.selectedWaves);
        if (next.has(waveKey)) {
          next.delete(waveKey);
        } else {
          next.add(waveKey);
        }
        return { ...w, selectedWaves: next };
      }),
    }));
  },

  clearWaves: (windowId) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, selectedWaves: new Set() } : w
      ),
    }));
  },
}));
