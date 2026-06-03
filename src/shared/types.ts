// WaveView 共享类型定义

/** 解析后的波形单条曲线 */
export interface WaveformData {
  name: string;
  xData: number[];
  yData: number[];
  unit: { x: string; y: string };
}

/** 解析后的文件 */
export interface ParsedFile {
  filename: string;
  waveforms: WaveformData[];
  metadata: Record<string, unknown>;
}

/** IPC 通道常量 */
export const IPC_CHANNELS = {
  OPEN_FILE_DIALOG: 'open-file-dialog',
  FILE_OPENED: 'file-opened',
} as const;
