// Waveform data structure
export interface WaveformData {
  name: string;
  xData: number[];
  yData: number[];
  unit: { x: string; y: string };
}

// Parsed file structure
export interface ParsedFile {
  filename: string;
  waveforms: WaveformData[];
  metadata: Record<string, any>;
}

// File parser interface
export interface FileParser {
  canParse(filename: string): boolean;
  parse(content: string): ParsedFile;
}

// Plot window
export interface PlotWindow {
  id: string;
  title: string;
  waves: Array<{ filename: string; waveName: string }>;
}

// Settings
export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
}
