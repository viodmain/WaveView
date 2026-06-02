import { ParsedFile, WaveformData } from '../../shared/types';

/**
 * Parse Touchstone S-parameter files (.s1p, .s2p, .s3p, .s4p)
 *
 * Format:
 * - Header line: # [freq_unit] S [format] R [impedance]
 * - Data lines: freq val1 val2 val3 ...
 *   For multi-port files, data may span multiple lines per frequency point
 * - Format: RI (real/imag), MA (magnitude/angle), DB (dB/angle)
 */
export function parseSpFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n');

  // Determine number of ports from filename
  let numPorts = 0;
  const portMatch = filename.match(/\.s(\d+)p$/i);
  if (portMatch) {
    numPorts = parseInt(portMatch[1], 10);
  }

  // Parse header
  let freqUnit = 'HZ';
  let format = 'RI';
  let refImpedance = 50;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const parts = trimmed.substring(1).trim().split(/\s+/);
      for (let idx = 0; idx < parts.length; idx++) {
        const part = parts[idx].toUpperCase();
        if (['HZ', 'KHZ', 'MHZ', 'GHZ'].includes(part)) {
          freqUnit = part;
        } else if (['RI', 'MA', 'DB'].includes(part)) {
          format = part;
        } else if (part === 'R' && idx + 1 < parts.length) {
          refImpedance = parseFloat(parts[idx + 1]) || 50;
        }
      }
      break;
    }
  }

  // Frequency unit multiplier to convert to Hz
  const freqMultipliers: Record<string, number> = {
    HZ: 1,
    KHZ: 1e3,
    MHZ: 1e6,
    GHZ: 1e9,
  };
  const freqMult = freqMultipliers[freqUnit] || 1;

  // Infer numPorts from data if filename didn't match
  if (numPorts === 0) {
    // Try to infer from the first data line
    let firstDataLineValues: number[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/).map(Number).filter((v) => !isNaN(v));
      if (parts.length > 1) {
        firstDataLineValues = parts;
        break;
      }
    }
    // First value is frequency, remaining are S-param values (real+imag pairs)
    const sParamCount = firstDataLineValues.length - 1;
    // For N ports: N*N*2 values (real+imag per S-param entry)
    // Try common port counts
    for (let n = 1; n <= 10; n++) {
      if (n * n * 2 === sParamCount) {
        numPorts = n;
        break;
      }
    }
    if (numPorts === 0) {
      return {
        filename,
        waveforms: [],
        metadata: { type: 'sparameter', error: `Cannot determine port count (found ${sParamCount} values, expected N*N*2)` },
      };
    }
  }

  // Parse data lines (skip comment lines starting with !)
  const frequencies: number[] = [];
  const sParams: number[][][] = []; // [freq][row][col]

  let currentValues: number[] = [];
  let freqStarted = false;

  const expectedValues = numPorts * numPorts * 2; // real + imag per S-param

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#')) continue;

    // Parse numeric values, skip NaN
    const parts = trimmed.split(/\s+/).map(Number).filter((v) => !isNaN(v));

    if (!freqStarted) {
      // First value is the frequency
      if (parts.length > 0) {
        frequencies.push(parts[0] * freqMult); // Convert to Hz
        currentValues = parts.slice(1);
        freqStarted = true;
      }
    } else {
      // Continuation line
      currentValues.push(...parts);
    }

    // Check if we have all values for this frequency point
    if (freqStarted && currentValues.length >= expectedValues) {
      // Convert to magnitude matrix based on format
      const matrix: number[][] = [];
      for (let i = 0; i < numPorts; i++) {
        const row: number[] = [];
        for (let j = 0; j < numPorts; j++) {
          const idx = (i * numPorts + j) * 2;
          const val1 = currentValues[idx];
          const val2 = currentValues[idx + 1];

          let magnitude: number;
          if (format === 'RI') {
            // Real/Imaginary -> magnitude
            magnitude = Math.sqrt(val1 * val1 + val2 * val2);
          } else if (format === 'MA') {
            // Magnitude/Angle -> magnitude is already val1
            magnitude = val1;
          } else if (format === 'DB') {
            // dB/Angle -> convert dB to linear magnitude
            magnitude = Math.pow(10, val1 / 20);
          } else {
            magnitude = Math.sqrt(val1 * val1 + val2 * val2);
          }
          row.push(magnitude);
        }
        matrix.push(row);
      }
      sParams.push(matrix);
      currentValues = [];
      freqStarted = false;
    }
  }

  // Create waveforms (all frequencies are now in Hz)
  const waveforms: WaveformData[] = [];

  for (let i = 0; i < numPorts; i++) {
    for (let j = 0; j < numPorts; j++) {
      const yData = sParams.map((sp) => sp[i][j]);
      if (yData.length > 0) {
        waveforms.push({
          name: `S${i + 1}${j + 1}`,
          xData: frequencies,
          yData,
          unit: { x: 'Hz', y: format === 'DB' ? 'dB' : 'mag' },
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
