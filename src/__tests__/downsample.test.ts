import { describe, it, expect } from 'vitest';
import { downsampleLTTB, downsampleMinMax, downsampleIfNeeded } from '../renderer/utils/downsample';

describe('downsampleLTTB', () => {
  it('returns original data when below target points', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 20, 30, 40, 50];
    const result = downsampleLTTB(x, y, 10);
    expect(result.xData).toEqual(x);
    expect(result.yData).toEqual(y);
  });

  it('reduces point count to target', () => {
    const x = Array.from({ length: 10000 }, (_, i) => i);
    const y = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 100));
    const result = downsampleLTTB(x, y, 100);
    expect(result.xData.length).toBe(100);
    expect(result.yData.length).toBe(100);
  });

  it('always includes first and last points', () => {
    const x = Array.from({ length: 1000 }, (_, i) => i);
    const y = Array.from({ length: 1000 }, (_, i) => i * 2);
    const result = downsampleLTTB(x, y, 50);
    expect(result.xData[0]).toBe(0);
    expect(result.yData[0]).toBe(0);
    expect(result.xData[result.xData.length - 1]).toBe(999);
    expect(result.yData[result.yData.length - 1]).toBe(1998);
  });

  it('handles target points < 3', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 20, 30, 40, 50];
    const result = downsampleLTTB(x, y, 2);
    expect(result.xData).toEqual(x);
    expect(result.yData).toEqual(y);
  });
});

describe('downsampleMinMax', () => {
  it('returns original data when below target points', () => {
    const x = [1, 2, 3];
    const y = [10, 20, 30];
    const result = downsampleMinMax(x, y, 10);
    expect(result.xData).toEqual(x);
    expect(result.yData).toEqual(y);
  });

  it('reduces point count', () => {
    const x = Array.from({ length: 10000 }, (_, i) => i);
    const y = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 100));
    const result = downsampleMinMax(x, y, 100);
    expect(result.xData.length).toBeLessThanOrEqual(200); // Min-max can produce up to 2x target
    expect(result.xData.length).toBeGreaterThan(0);
  });

  it('preserves min and max values in each bucket', () => {
    const x = [1, 2, 3, 4, 5, 6];
    const y = [10, 100, 20, 80, 30, 60];
    const result = downsampleMinMax(x, y, 3);
    // Should preserve the peaks (100 and 80)
    expect(result.yData).toContain(100);
    expect(result.yData).toContain(80);
  });
});

describe('downsampleIfNeeded', () => {
  it('returns original data when below threshold', () => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    const y = Array.from({ length: 100 }, (_, i) => i);
    const result = downsampleIfNeeded(x, y, 5000);
    expect(result.xData).toBe(x); // Same reference
    expect(result.yData).toBe(y);
  });

  it('downsamples when above threshold', () => {
    const x = Array.from({ length: 10000 }, (_, i) => i);
    const y = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 100));
    const result = downsampleIfNeeded(x, y, 5000, 2000);
    expect(result.xData.length).toBe(2000);
  });

  it('uses min-max for very large datasets', () => {
    const x = Array.from({ length: 200000 }, (_, i) => i);
    const y = Array.from({ length: 200000 }, (_, i) => Math.sin(i / 1000));
    const result = downsampleIfNeeded(x, y, 5000, 2000);
    expect(result.xData.length).toBeLessThanOrEqual(4000);
    expect(result.xData.length).toBeGreaterThan(0);
  });
});
