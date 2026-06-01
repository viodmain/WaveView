import { ParsedFile, WaveformData } from '../../shared/types';

export function parseTrFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n').filter((line) => line.trim());

  // Line 5 (index 4) contains column names
  const headerLine = lines[4] || '';
  const columns = headerLine.trim().split(/\s+/);

  // Data starts from line 6 (index 5)
  const dataLines = lines.slice(5);

  // Parse data
  const data: number[][] = columns.map(() => []);

  dataLines.forEach((line) => {
    const values = line.trim().split(/\s+/).map(Number);
    values.forEach((val, idx) => {
      if (idx < data.length && !isNaN(val)) {
        data[idx].push(val);
      }
    });
  });

  // Create waveforms (skip TIME column)
  const waveforms: WaveformData[] = [];
  const timeData = data[0] || [];

  for (let i = 1; i < columns.length; i++) {
    if (data[i].length > 0) {
      waveforms.push({
        name: columns[i],
        xData: timeData,
        yData: data[i],
        unit: { x: 's', y: 'V' },
      });
    }
  }

  return {
    filename,
    waveforms,
    metadata: {
      type: 'transient',
      columns: columns.slice(1),
    },
  };
}
