import { describe, it, expect } from 'vitest';
import { downsampleLTTB, autoDownsample } from '../renderer/utils/downsample';

describe('downsampleLTTB', () => {
  it('should return original data if target >= data length', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 20, 30, 40, 50];
    const [rx, ry] = downsampleLTTB(x, y, 10);
    expect(rx).toEqual(x);
    expect(ry).toEqual(y);
  });

  it('should reduce data points to target count', () => {
    const x = Array.from({ length: 1000 }, (_, i) => i);
    const y = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01));
    const [rx, ry] = downsampleLTTB(x, y, 100);
    expect(rx.length).toBe(100);
    expect(ry.length).toBe(100);
  });

  it('should always include first and last points', () => {
    const x = Array.from({ length: 1000 }, (_, i) => i);
    const y = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01));
    const [rx, ry] = downsampleLTTB(x, y, 50);
    expect(rx[0]).toBe(x[0]);
    expect(rx[rx.length - 1]).toBe(x[x.length - 1]);
    expect(ry[0]).toBe(y[0]);
    expect(ry[ry.length - 1]).toBe(y[y.length - 1]);
  });

  it('should preserve monotonic x ordering', () => {
    const x = Array.from({ length: 1000 }, (_, i) => i * 0.001);
    const y = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.01));
    const [rx] = downsampleLTTB(x, y, 100);
    for (let i = 1; i < rx.length; i++) {
      expect(rx[i]).toBeGreaterThan(rx[i - 1]);
    }
  });
});

describe('autoDownsample', () => {
  it('should not downsample small data', () => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    const y = Array.from({ length: 100 }, (_, i) => i);
    const [rx, ry] = autoDownsample(x, y, 5000);
    expect(rx).toEqual(x);
    expect(ry).toEqual(y);
  });

  it('should downsample large data to max points', () => {
    const x = Array.from({ length: 50000 }, (_, i) => i);
    const y = Array.from({ length: 50000 }, (_, i) => Math.sin(i * 0.001));
    const [rx, ry] = autoDownsample(x, y, 5000);
    expect(rx.length).toBe(5000);
    expect(ry.length).toBe(5000);
  });

  it('should use default 5000 if not specified', () => {
    const x = Array.from({ length: 50000 }, (_, i) => i);
    const y = Array.from({ length: 50000 }, (_, i) => i);
    const [rx] = autoDownsample(x, y);
    expect(rx.length).toBe(5000);
  });
});
