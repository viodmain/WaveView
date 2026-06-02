import { describe, it, expect } from 'vitest';
import { parseTrFile } from '../renderer/parsers/trParser';
import { parseAcFile } from '../renderer/parsers/acParser';
import { parseSpFile } from '../renderer/parsers/spParser';

describe('trParser', () => {
  const sampleTr0 = `00060000000000009601    * sailwind simulation
Wed Oct 30 16:48:39 2024 Copyright (C). 2009 All Rights Reserved.
                           0
                          1       1       1       1       1       1
        TIME            u5_10           u6_16           u5_10_die       u6_16_di
e       u5_10_stimulus  $&%#
+0.0000e+00+4.6080e-09+4.6086e-09+4.6039e-09+4.6106e-09+0.0000e+00+0.0000e+00
+4.6080e-09+4.6086e-09+4.6039e-09+4.6106e-09+0.0000e+00+3.0000e-13+4.6080e-09
+4.6086e-09+4.6039e-09+4.6106e-09+1.8850e-03+6.0000e-13+4.6080e-09+4.6086e-09`;

  it('parses concatenated scientific notation values', () => {
    const result = parseTrFile('test.tr0', sampleTr0);
    expect(result.waveforms.length).toBe(6);
    expect(result.metadata.type).toBe('transient');
  });

  it('correctly merges split column names', () => {
    const result = parseTrFile('test.tr0', sampleTr0);
    const names = result.waveforms.map((w) => w.name);
    expect(names).toContain('u6_16_die'); // Split across lines
    expect(names).toContain('u5_10_stimulus');
    expect(names).toContain('$&%#');
  });

  it('parses correct number of data points', () => {
    const result = parseTrFile('test.tr0', sampleTr0);
    expect(result.waveforms[0].xData.length).toBe(3);
    expect(result.waveforms[0].xData[0]).toBe(0);
  });

  it('returns empty waveforms for empty content', () => {
    const result = parseTrFile('test.tr0', 'no data here');
    expect(result.waveforms.length).toBe(0);
    expect(result.metadata.error).toBeDefined();
  });

  it('returns empty waveforms for content with no scientific notation', () => {
    const result = parseTrFile('test.tr0', 'line1\nline2\nline3\nline4\nline5\n123 456');
    expect(result.waveforms.length).toBe(0);
  });
});

describe('acParser', () => {
  const sampleAc0 = `#H
SOURCE='PrimeSim HSPICE' VERSION='S-2021.09'
TITLE='* test'
#N 'v(out1)' 'v(out2)'
#C  1.00000e+00   2   1.00000e+00 / 0.00000e+00  2.00000e+00 / 3.00000e+00
#C  1.00000e+01   2   1.10000e+00 / 1.00000e-01  2.10000e+00 / 3.10000e+00`;

  it('parses node names and strips quotes', () => {
    const result = parseAcFile('test.ac0', sampleAc0);
    expect(result.metadata.nodes).toEqual(['v(out1)', 'v(out2)']);
  });

  it('creates magnitude and phase waveforms for each node', () => {
    const result = parseAcFile('test.ac0', sampleAc0);
    expect(result.waveforms.length).toBe(4); // 2 nodes × 2 (mag + phase)
    expect(result.waveforms[0].name).toBe('v(out1)_mag');
    expect(result.waveforms[1].name).toBe('v(out1)_phase');
  });

  it('correctly parses frequencies', () => {
    const result = parseAcFile('test.ac0', sampleAc0);
    expect(result.waveforms[0].xData).toEqual([1, 10]);
  });

  it('handles / separator without spaces', () => {
    const content = `#H\nSOURCE='test'\n#N 'v(out)'\n#C  1.0   1   5.0/3.0`;
    const result = parseAcFile('test.ac0', content);
    // magnitude = sqrt(25 + 9) = sqrt(34) ≈ 5.831
    expect(result.waveforms[0].yData[0]).toBeCloseTo(Math.sqrt(34), 2);
  });

  it('handles multi-line #C data', () => {
    const content = `#H\nSOURCE='test'\n#N 'v(a)' 'v(b)'\n#C  1.0   2   1.0 / 2.0\n 3.0 / 4.0`;
    const result = parseAcFile('test.ac0', content);
    expect(result.waveforms[0].yData[0]).toBeCloseTo(Math.sqrt(5), 2); // mag of (1,2)
    expect(result.waveforms[2].yData[0]).toBeCloseTo(Math.sqrt(25), 2); // mag of (3,4)
  });
});

describe('spParser', () => {
  const sampleS2p = `! 2-port S-parameter file
# HZ S RI R 50
! freq S11_re S11_im S21_re S21_im S12_re S12_im S22_re S22_im
1.000e+09  0.5  0.1  -0.3  0.2  -0.3  0.2  0.4  -0.1
2.000e+09  0.4  0.2  -0.2  0.3  -0.2  0.3  0.3  -0.2`;

  it('parses port count from filename', () => {
    const result = parseSpFile('test.s2p', sampleS2p);
    expect(result.metadata.numPorts).toBe(2);
  });

  it('creates S-parameter waveforms', () => {
    const result = parseSpFile('test.s2p', sampleS2p);
    expect(result.waveforms.length).toBe(4); // S11, S12, S21, S22
    const names = result.waveforms.map((w) => w.name);
    expect(names).toContain('S11');
    expect(names).toContain('S21');
  });

  it('frequencies are stored in Hz', () => {
    const result = parseSpFile('test.s2p', sampleS2p);
    expect(result.waveforms[0].xData).toEqual([1e9, 2e9]);
    expect(result.waveforms[0].unit.x).toBe('Hz');
  });

  it('calculates magnitude correctly for RI format', () => {
    const result = parseSpFile('test.s2p', sampleS2p);
    const s11 = result.waveforms.find((w) => w.name === 'S11')!;
    // S11 at freq 1: sqrt(0.5^2 + 0.1^2) = sqrt(0.26) ≈ 0.5099
    expect(s11.yData[0]).toBeCloseTo(Math.sqrt(0.26), 3);
  });

  it('converts GHz frequencies to Hz', () => {
    const content = `# GHZ S RI R 50\n1.0  0.5  0.1  0.0  0.0  0.0  0.0  0.5  0.1`;
    const result = parseSpFile('test.s2p', content);
    expect(result.waveforms[0].xData[0]).toBeCloseTo(1e9, 0);
  });

  it('handles MA format', () => {
    const content = `# HZ S MA R 50\n1.0e9  0.5  45  0.0  0.0  0.0  0.0  0.5  45`;
    const result = parseSpFile('test.s2p', content);
    const s11 = result.waveforms.find((w) => w.name === 'S11')!;
    expect(s11.yData[0]).toBeCloseTo(0.5, 3); // magnitude is directly val1
  });

  it('handles DB format', () => {
    const content = `# HZ S DB R 50\n1.0e9  -6.02  0  0.0  0.0  0.0  0.0  -6.02  0`;
    const result = parseSpFile('test.s2p', content);
    const s11 = result.waveforms.find((w) => w.name === 'S11')!;
    // -6.02 dB = 10^(-6.02/20) ≈ 0.4999
    expect(s11.yData[0]).toBeCloseTo(0.5, 1);
  });

  it('infers port count from data when filename has no match', () => {
    const content = `# HZ S RI R 50\n1.0e9  0.5  0.1  0.0  0.0  0.0  0.0  0.5  0.1`;
    const result = parseSpFile('data.txt', content);
    expect(result.metadata.numPorts).toBe(2);
  });

  it('returns error for unresolvable port count', () => {
    const content = `# HZ S RI R 50\n1.0e9  0.5  0.1  0.0`;
    const result = parseSpFile('data.txt', content);
    expect(result.metadata.error).toBeDefined();
    expect(result.waveforms.length).toBe(0);
  });
});
