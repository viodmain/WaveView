import { create } from 'zustand';
import type { ParsedFile } from '../../shared/types';

interface FileStore {
  files: Map<string, ParsedFile>;
  addFile: (file: ParsedFile) => void;
  removeFile: (filename: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: new Map(),
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
