import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseTrFile } from '../renderer/parsers/trParser';
import { parseAcFile } from '../renderer/parsers/acParser';
import { parseSpFile } from '../renderer/parsers/spParser';
import { parseFile } from '../renderer/parsers/parserFactory';

const EXAMPLE_DIR = resolve(__dirname, '../../file_example');

function readExample(relativePath: string): string {
  return readFileSync(resolve(EXAMPLE_DIR, relativePath), 'utf-8');
}

describe('trParser', () => {
  describe('old format (no-space scientific notation)', () => {
    const content = readExample('瞬态/rmin2_modify_2_pathadapt_sine.tr0');
    const result = parseTrFile('rmin2_modify_2_pathadapt_sine.tr0', content);

    it('should parse filename', () => {
      expect(result.filename).toBe('rmin2_modify_2_pathadapt_sine.tr0');
    });

    it('should extract column names', () => {
      expect(result.waveforms.length).toBeGreaterThan(0);
      const names = result.waveforms.map((w) => w.name);
      expect(names).toContain('u5_10');
      expect(names).toContain('u6_16');
    });

    it('should parse numeric data', () => {
      for (const wave of result.waveforms) {
        expect(wave.xData.length).toBeGreaterThan(0);
        expect(wave.yData.length).toBe(wave.xData.length);
        expect(wave.xData.every((v) => isFinite(v))).toBe(true);
        expect(wave.yData.every((v) => isFinite(v))).toBe(true);
      }
    });

    it('should have TIME as x-axis unit', () => {
      expect(result.metadata.analysis).toBe('TRAN');
      expect(result.waveforms[0].unit.x).toBe('s');
    });
  });

  describe('new format (#H/#N/#C format)', () => {
    const content = readExample('瞬态/sin.tr0');
    const result = parseTrFile('sin.tr0', content);

    it('should parse filename', () => {
      expect(result.filename).toBe('sin.tr0');
    });

    it('should extract node names', () => {
      expect(result.waveforms.length).toBe(2);
      const names = result.waveforms.map((w) => w.name);
      expect(names).toContain('v(nnn15681)');
      expect(names).toContain('v(nnn15528)');
    });

    it('should parse numeric data', () => {
      for (const wave of result.waveforms) {
        expect(wave.xData.length).toBeGreaterThan(0);
        expect(wave.yData.length).toBe(wave.xData.length);
        expect(wave.xData.every((v) => isFinite(v))).toBe(true);
        expect(wave.yData.every((v) => isFinite(v))).toBe(true);
      }
    });

    it('should have TIME as x-axis unit', () => {
      expect(result.metadata.analysis).toBe('TRAN');
      expect(result.waveforms[0].unit.x).toBe('s');
    });
  });
});

describe('acParser', () => {
  const content = readExample('瞬态/opamp.ac0');
  const result = parseAcFile('opamp.ac0', content);

  it('should parse filename', () => {
    expect(result.filename).toBe('opamp.ac0');
  });

  it('should extract node names', () => {
    expect(result.waveforms.length).toBeGreaterThan(0);
    const names = result.waveforms.map((w) => w.name);
    expect(names).toContain('v(nnn15681)');
    expect(names).toContain('v(nnn15518)');
  });

  it('should parse 12 nodes', () => {
    expect(result.waveforms.length).toBe(12);
  });

  it('should parse numeric data', () => {
    for (const wave of result.waveforms) {
      expect(wave.xData.length).toBeGreaterThan(0);
      expect(wave.yData.length).toBe(wave.xData.length);
      expect(wave.xData.every((v) => isFinite(v))).toBe(true);
      expect(wave.yData.every((v) => isFinite(v))).toBe(true);
    }
  });

  it('should have Hz as x-axis unit', () => {
    expect(result.waveforms[0].unit.x).toBe('Hz');
  });
});

describe('spParser', () => {
  describe('s2p file', () => {
    const content = readExample('S-parameter/Cap1.s2p');
    const result = parseSpFile('Cap1.s2p', content);

    it('should parse filename', () => {
      expect(result.filename).toBe('Cap1.s2p');
    });

    it('should detect 2 ports', () => {
      expect(result.metadata.numPorts).toBe(2);
    });

    it('should generate 4 S-parameter waveforms', () => {
      expect(result.waveforms.length).toBe(4);
      const names = result.waveforms.map((w) => w.name);
      expect(names).toContain('S11 (dB)');
      expect(names).toContain('S21 (dB)');
      expect(names).toContain('S12 (dB)');
      expect(names).toContain('S22 (dB)');
    });

    it('should parse numeric data', () => {
      for (const wave of result.waveforms) {
        expect(wave.xData.length).toBeGreaterThan(0);
        expect(wave.yData.length).toBe(wave.xData.length);
        expect(wave.xData.every((v) => isFinite(v))).toBe(true);
        expect(wave.yData.every((v) => isFinite(v))).toBe(true);
      }
    });
  });

  describe('s4p file', () => {
    const content = readExample('S-parameter/AA_Original4PortVictim.s4p');
    const result = parseSpFile('AA_Original4PortVictim.s4p', content);

    it('should detect 4 ports', () => {
      expect(result.metadata.numPorts).toBe(4);
    });

    it('should generate 16 S-parameter waveforms', () => {
      expect(result.waveforms.length).toBe(16);
    });
  });
});

describe('parserFactory', () => {
  it('should route .tr0 to trParser', () => {
    const content = readExample('瞬态/rmin2_modify_2_pathadapt_sine.tr0');
    const result = parseFile('test.tr0', content);
    expect(result.metadata.analysis).toBe('TRAN');
  });

  it('should route .ac0 to acParser', () => {
    const content = readExample('瞬态/opamp.ac0');
    const result = parseFile('test.ac0', content);
    expect(result.metadata.analysis).toBe('AC');
  });

  it('should route .s2p to spParser', () => {
    const content = readExample('S-parameter/Cap1.s2p');
    const result = parseFile('test.s2p', content);
    expect(result.metadata.analysis).toBe('SP');
  });

  it('should throw for unsupported format', () => {
    expect(() => parseFile('test.xyz', '')).toThrow('Unsupported file format');
  });
});
