import { create } from 'zustand';
import type { ParsedFile } from '../../shared/types';

interface FileStore {
  files: Map<string, ParsedFile>;
  addFile: (file: ParsedFile) => void;
  removeFile: (filename: string) => void;
}

/** mock 数据：用于 UI Demo 阶段 */
const MOCK_FILES: ParsedFile[] = [
  {
    filename: 'opamp.ac0',
    metadata: { analysis: 'AC', unit: { x: 'Hz' } },
    waveforms: [
      {
        name: 'v(nnn15681)',
        xData: Array.from({ length: 200 }, (_, i) => Math.pow(10, i / 50)),
        yData: Array.from({ length: 200 }, (_, i) => 20 * Math.log10(1 / Math.sqrt(1 + Math.pow(i / 50, 2)))),
        unit: { x: 'Hz', y: 'dB' },
      },
      {
        name: 'v(nnn15518)',
        xData: Array.from({ length: 200 }, (_, i) => Math.pow(10, i / 50)),
        yData: Array.from({ length: 200 }, (_, i) => 18 * Math.log10(1 / Math.sqrt(1 + Math.pow((i + 10) / 50, 2)))),
        unit: { x: 'Hz', y: 'dB' },
      },
    ],
  },
  {
    filename: 'sine.tr0',
    metadata: { analysis: 'TRAN', unit: { x: 's' } },
    waveforms: [
      {
        name: 'v(out)',
        xData: Array.from({ length: 500 }, (_, i) => i * 1e-6),
        yData: Array.from({ length: 500 }, (_, i) => Math.sin(2 * Math.PI * 1e3 * i * 1e-6)),
        unit: { x: 's', y: 'V' },
      },
      {
        name: 'v(in)',
        xData: Array.from({ length: 500 }, (_, i) => i * 1e-6),
        yData: Array.from({ length: 500 }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 1e3 * i * 1e-6)),
        unit: { x: 's', y: 'V' },
      },
    ],
  },
];

const initialFiles = new Map<string, ParsedFile>();
MOCK_FILES.forEach((f) => initialFiles.set(f.filename, f));

export const useFileStore = create<FileStore>((set) => ({
  files: initialFiles,
  addFile: (file) =>
    set((state) => {
      const next = new Map(state.files);
      next.set(file.filename, file);
      return { files: next };
    }),
  removeFile: (filename) =>
    set((state) => {
      const next = new Map(state.files);
      next.delete(filename);
      return { files: next };
    }),
}));
