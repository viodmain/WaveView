import { ParsedFile, WaveformData } from '../../shared/types';

/**
 * Extract numeric values from a string that may contain '/' separators
 * between real and imaginary parts. Handles cases like:
 *   "1.0 / 2.0"   (space around /)
 *   "1.0 /2.0"    (no space after /)
 *   "1.0/ 2.0"    (no space before /)
 *   "1.0/2.0"     (no spaces)
 */
function extractNumericValues(text: string): number[] {
  // Replace '/' with a space, then extract numbers
  // This handles all spacing variants around '/'
  const cleaned = text.replace(/\//g, ' ');
  const numRegex = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  const values: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = numRegex.exec(cleaned)) !== null) {
    const val = parseFloat(match[0]);
    if (!isNaN(val)) {
      values.push(val);
    }
  }
  return values;
}

/**
 * Parse HSPICE AC analysis files (.ac0, .ac1)
 *
 * Format:
 * - #H: header block (lines 1-8)
 * - #N: node names (may have continuation lines without #N prefix)
 * - #C: complex data blocks (freq + count + real/imag pairs, may span multiple lines)
 *   Values separated by '/' between real and imaginary parts
 *   Continuation lines don't have #C prefix
 */
export function parseAcFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n');

  // Parse node names from #N section
  let nodes: string[] = [];
  let inNodeSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#N')) {
      inNodeSection = true;
      // Extract node names from #N line (strip quotes)
      const match = line.match(/#N\s+(.*)/);
      if (match) {
        const names = match[1]
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n.replace(/^'|'$/g, ''));
        nodes.push(...names);
      }
    } else if (inNodeSection) {
      // Continuation line (no # prefix, contains more node names)
      if (line.startsWith('#')) {
        inNodeSection = false;
      } else if (line.trim()) {
        const names = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n.replace(/^'|'$/g, ''));
        nodes.push(...names);
      }
    }
  }

  // Parse #C data blocks
  const frequencies: number[] = [];
  const allValues: number[][] = []; // Each entry is [re1, im1, re2, im2, ...] for one frequency

  let inDataBlock = false;
  let currentValues: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#C')) {
      // Start of a new data block
      // Save previous block if exists (must push to both arrays together)
      if (inDataBlock) {
        allValues.push(currentValues);
      }

      // Parse: #C freq count real/imag real/imag ...
      const parts = line.split(/\s+/);
      const freq = parseFloat(parts[1]);
      frequencies.push(freq);

      // Extract numeric values from the rest of the line (after freq and count)
      currentValues = extractNumericValues(parts.slice(3).join(' '));
      inDataBlock = true;
    } else if (inDataBlock && !line.startsWith('#')) {
      // Continuation line of #C data block
      const values = extractNumericValues(line);
      currentValues.push(...values);
    }
  }
  // Save last block (push to both arrays together to keep lengths in sync)
  if (inDataBlock) {
    allValues.push(currentValues);
  }

  // Create waveforms: magnitude and phase for each node
  const waveforms: WaveformData[] = [];

  for (let n = 0; n < nodes.length; n++) {
    const magnitudeData: number[] = [];
    const phaseData: number[] = [];

    for (let f = 0; f < allValues.length; f++) {
      const vals = allValues[f];
      const realIdx = n * 2;
      const imagIdx = n * 2 + 1;

      if (realIdx < vals.length && imagIdx < vals.length) {
        const real = vals[realIdx];
        const imag = vals[imagIdx];
        magnitudeData.push(Math.sqrt(real * real + imag * imag));
        phaseData.push(Math.atan2(imag, real) * (180 / Math.PI));
      }
    }

    if (magnitudeData.length > 0) {
      waveforms.push({
        name: `${nodes[n]}_mag`,
        xData: frequencies,
        yData: magnitudeData,
        unit: { x: 'Hz', y: 'V' },
      });
      waveforms.push({
        name: `${nodes[n]}_phase`,
        xData: frequencies,
        yData: phaseData,
        unit: { x: 'Hz', y: 'deg' },
      });
    }
  }

  return {
    filename,
    waveforms,
    metadata: {
      type: 'ac',
      nodes,
    },
  };
}
