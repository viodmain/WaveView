import type { ParsedFile } from '../../shared/types';
import { parseTrFile } from './trParser';
import { parseAcFile } from './acParser';
import { parseSpFile } from './spParser';

export interface FileParser {
  canParse(filename: string): boolean;
  parse(filename: string, content: string): ParsedFile;
}

const parsers: FileParser[] = [
  { canParse: (f) => /\.tr\d+$/i.test(f), parse: parseTrFile },
  { canParse: (f) => /\.ac\d+$/i.test(f), parse: parseAcFile },
  { canParse: (f) => /\.s\d+p$/i.test(f), parse: parseSpFile },
];

export function parseFile(filename: string, content: string): ParsedFile {
  const parser = parsers.find((p) => p.canParse(filename));
  if (!parser) {
    throw new Error(`不支持的文件格式: ${filename}`);
  }
  return parser.parse(filename, content);
}
