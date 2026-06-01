import { ParsedFile, WaveformData } from '../../shared/types';

export function parseSpFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n').filter((line) => line.trim());

  // Parse header line (# line)
  let freqUnit = 'HZ';
  let format = 'RI'; // Real/Imaginary
  let refImpedance = 50;
  let numPorts = 0;

  // Determine number of ports from filename
  const portMatch = filename.match(/\.s(\d+)p$/);
  if (portMatch) {
    numPorts = parseInt(portMatch[1]);
  }

  // Parse header
  for (const line of lines) {
    if (line.startsWith('#')) {
      const parts = line.substring(1).trim().split(/\s+/);
      parts.forEach((part, idx) => {
        if (part === 'HZ' || part === 'KHZ' || part === 'MHZ' || part === 'GHZ') {
          freqUnit = part;
        } else if (part === 'RI' || part === 'MA' || part === 'DB') {
          format = part;
        } else if (part === 'R') {
          refImpedance = parseFloat(parts[idx + 1]) || 50;
        }
      });
      break;
    }
  }

  // Parse data lines
  const frequencies: number[] = [];
  const sParams: number[][][] = []; // [freq][row][col]

  let currentFreqData: number[][] = [];
  let currentValues: number[] = [];

  for (const line of lines) {
    if (line.startsWith('!') || line.startsWith('#')) continue;

    const parts = line.trim().split(/\s+/).map(Number);

    // First value of each frequency point is the frequency
    if (currentValues.length === 0 && parts.length > 0) {
      frequencies.push(parts[0]);
      currentValues = parts.slice(1);
    } else {
      currentValues.push(...parts);
    }

    // Check if we have all values for this frequency
    const expectedValues = numPorts * numPorts * 2; // real + imag for each S-param
    if (currentValues.length >= expectedValues) {
      // Convert to matrix
      const matrix: number[][] = [];
      for (let i = 0; i < numPorts; i++) {
        const row: number[] = [];
        for (let j = 0; j < numPorts; j++) {
          const idx = (i * numPorts + j) * 2;
          const real = currentValues[idx];
          const imag = currentValues[idx + 1];
          // Store magnitude
          row.push(Math.sqrt(real * real + imag * imag));
        }
        matrix.push(row);
      }
      sParams.push(matrix);
      currentValues = [];
    }
  }

  // Create waveforms
  const waveforms: WaveformData[] = [];

  for (let i = 0; i < numPorts; i++) {
    for (let j = 0; j < numPorts; j++) {
      const yData = sParams.map((sp) => sp[i][j]);
      if (yData.length > 0) {
        waveforms.push({
          name: `S${i + 1}${j + 1}`,
          xData: frequencies,
          yData,
          unit: { x: freqUnit.toLowerCase(), y: 'mag' },
        });
      }
    }
  }

  return {
    filename,
    waveforms,
    metadata: {
      type: 'sparameter',
      numPorts,
      freqUnit,
      format,
      refImpedance,
    },
  };
}
