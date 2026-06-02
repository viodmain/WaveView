import { ParsedFile } from '../../shared/types';
import { parseTrFile } from './trParser';
import { parseAcFile } from './acParser';
import { parseSpFile } from './spParser';

export function parseFile(filename: string, content: string): ParsedFile | null {
  const ext = filename.toLowerCase();

  try {
    if (ext.endsWith('.tr0') || ext.endsWith('.tr1') || ext.endsWith('.tr2')) {
      return parseTrFile(filename, content);
    }

    if (ext.endsWith('.ac0') || ext.endsWith('.ac1')) {
      return parseAcFile(filename, content);
    }

    if (/\.s\d+p$/.test(ext)) {
      return parseSpFile(filename, content);
    }

    console.warn(`Unsupported file format: ${filename}`);
    return null;
  } catch (err) {
    console.error(`Failed to parse file ${filename}:`, err);
    return {
      filename,
      waveforms: [],
      metadata: { type: 'unknown', error: String(err) },
    };
  }
}
