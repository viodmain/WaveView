import { ParsedFile, WaveformData } from '../../shared/types';

export function parseAcFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n').filter((line) => line.trim());

  // Parse header to get node names
  let nodes: string[] = [];
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#N')) {
      // Extract node names
      const match = line.match(/#N\s+(.*)/);
      if (match) {
        nodes = match[1].split(/\s+/).filter(Boolean);
      }
    } else if (line.startsWith('#C')) {
      dataLines.push(line);
    }
  }

  // Parse data
  const frequencies: number[] = [];
  const nodeData: number[][] = nodes.map(() => []);
  const nodePhase: number[][] = nodes.map(() => []);

  dataLines.forEach((line) => {
    // Format: #C freq node_count real/imag real/imag ...
    const parts = line.trim().split(/\s+/);
    const freq = parseFloat(parts[1]);
    frequencies.push(freq);

    // Parse real/imag pairs for each node
    let nodeIdx = 0;
    for (let i = 3; i < parts.length && nodeIdx < nodes.length; i += 2) {
      const real = parseFloat(parts[i]);
      const imag = parseFloat(parts[i + 1]);

      // Calculate magnitude and phase
      const magnitude = Math.sqrt(real * real + imag * imag);
      const phase = Math.atan2(imag, real) * (180 / Math.PI);

      nodeData[nodeIdx].push(magnitude);
      nodePhase[nodeIdx].push(phase);
      nodeIdx++;
    }
  });

  // Create waveforms
  const waveforms: WaveformData[] = [];

  nodes.forEach((node, idx) => {
    if (nodeData[idx].length > 0) {
      // Magnitude waveform
      waveforms.push({
        name: `${node}_mag`,
        xData: frequencies,
        yData: nodeData[idx],
        unit: { x: 'Hz', y: 'V' },
      });

      // Phase waveform
      waveforms.push({
        name: `${node}_phase`,
        xData: frequencies,
        yData: nodePhase[idx],
        unit: { x: 'Hz', y: 'deg' },
      });
    }
  });

  return {
    filename,
    waveforms,
    metadata: {
      type: 'ac',
      nodes,
    },
  };
}
