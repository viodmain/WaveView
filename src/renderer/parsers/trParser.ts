import { ParsedFile, WaveformData } from '../../shared/types';

/**
 * Parse HSPICE transient analysis files (.tr0, .tr1, .tr2)
 *
 * Format:
 * - Lines 1-4: header metadata
 * - Lines 5+: column names (may span multiple lines when split at line boundary)
 * - Data lines: concatenated scientific notation values without spaces
 *   e.g. "+0.0000e+00+4.6080e-09+4.6086e-09..."
 */
export function parseTrFile(filename: string, content: string): ParsedFile {
  const lines = content.split('\n');

  // Regex to match scientific notation numbers
  const numRegex = /[+-]?\d+\.\d+[eE][+-]\d+/g;

  // Find where data starts (first line that starts with a number)
  let headerEndIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*[+-]?\d+\.\d+[eE]/.test(lines[i])) {
      headerEndIdx = i;
      break;
    }
  }

  if (headerEndIdx === -1) {
    return { filename, waveforms: [], metadata: { type: 'transient', error: 'No data found' } };
  }

  // Count data columns from first data line
  const firstDataLine = lines[headerEndIdx].trim();
  const firstDataMatches = firstDataLine.match(numRegex);
  const numDataCols = firstDataMatches ? firstDataMatches.length : 0;

  if (numDataCols === 0) {
    return { filename, waveforms: [], metadata: { type: 'transient', error: 'No data values found' } };
  }

  // Collect column names from header lines (index 4 to headerEndIdx-1)
  // Handle column names split across line boundaries:
  // If a line ends without trailing whitespace, the last token continues on the next line
  const allTokens: string[] = [];
  for (let i = 4; i < headerEndIdx; i++) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    if (!trimmed) continue;

    // Check if line ends mid-token (no trailing whitespace)
    const endsNonSpace = !/\s/.test(trimmed[trimmed.length - 1]);
    const tokens = raw.trim().split(/\s+/).filter(Boolean);

    if (endsNonSpace && tokens.length > 0 && allTokens.length > 0) {
      // Merge last token of previous line with first token of this line
      allTokens[allTokens.length - 1] += tokens.shift();
    }
    allTokens.push(...tokens);
  }

  // If we still have more tokens than data columns, merge single-char tokens
  // (single chars are likely line-boundary splits of column names)
  while (allTokens.length > numDataCols) {
    let merged = false;
    for (let i = 0; i < allTokens.length - 1; i++) {
      if (allTokens[i].length === 1 || allTokens[i + 1].length === 1) {
        allTokens[i] = allTokens[i] + allTokens[i + 1];
        allTokens.splice(i + 1, 1);
        merged = true;
        break;
      }
    }
    if (!merged) break;
  }

  const columnNames = allTokens.slice(0, numDataCols);

  // Parse data lines
  const data: number[][] = Array.from({ length: numDataCols }, () => []);

  for (let i = headerEndIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const matches = line.match(numRegex);
    if (!matches) continue;

    const values = matches.map(Number);
    for (let j = 0; j < Math.min(values.length, numDataCols); j++) {
      data[j].push(values[j]);
    }
  }

  // Create waveforms (skip TIME column at index 0)
  const waveforms: WaveformData[] = [];
  const timeData = data[0] || [];

  for (let i = 1; i < numDataCols; i++) {
    if (data[i].length > 0) {
      waveforms.push({
        name: columnNames[i],
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
      columns: columnNames.slice(1),
    },
  };
}
