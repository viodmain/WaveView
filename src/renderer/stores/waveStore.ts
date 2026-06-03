import { create } from 'zustand';

interface WaveStore {
  /** 当前选中的波形 key 集合，格式: "filename::waveName" */
  selectedWaves: Set<string>;
  toggleWave: (key: string) => void;
  clearSelection: () => void;
}

export const useWaveStore = create<WaveStore>((set) => ({
  selectedWaves: new Set<string>(),
  toggleWave: (key) =>
    set((state) => {
      const next = new Set(state.selectedWaves);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { selectedWaves: next };
    }),
  clearSelection: () => set({ selectedWaves: new Set() }),
}));
