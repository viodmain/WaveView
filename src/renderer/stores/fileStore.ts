import { create } from 'zustand';
import { ParsedFile } from '../../shared/types';

interface FileStore {
  files: Map<string, ParsedFile>;
  addFile: (file: ParsedFile) => void;
  removeFile: (filename: string) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: new Map(),
  addFile: (file) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(file.filename, file);
      return { files: newFiles };
    }),
  removeFile: (filename) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(filename);
      return { files: newFiles };
    }),
  clearFiles: () => set({ files: new Map() }),
}));
