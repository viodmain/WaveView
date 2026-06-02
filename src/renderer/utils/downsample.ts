/**
 * Data downsampling utilities for large waveforms.
 *
 * Uses the Largest Triangle Three Buckets (LTTB) algorithm to reduce
 * the number of data points while preserving the visual shape of the waveform.
 *
 * Reference: Sveinn Steinarsson - "Downsampling Time Series for Visual Representation"
 */

/**
 * Downsample data using the LTTB algorithm.
 * Preserves peaks and valleys while reducing point count.
 *
 * @param xData - X-axis data array
 * @param yData - Y-axis data array
 * @param targetPoints - Desired number of output points (default: 2000)
 * @returns Downsampled { xData, yData } arrays
 */
export function downsampleLTTB(
  xData: number[],
  yData: number[],
  targetPoints: number = 2000
): { xData: number[]; yData: number[] } {
  const totalPoints = xData.length;

  // No downsampling needed if already below target
  if (totalPoints <= targetPoints || targetPoints < 3) {
    return { xData, yData };
  }

  const resultX: number[] = [];
  const resultY: number[] = [];

  // Always include first and last points
  resultX.push(xData[0]);
  resultY.push(yData[0]);

  const bucketSize = (totalPoints - 2) / (targetPoints - 2);

  let prevIndex = 0;

  for (let i = 1; i < targetPoints - 1; i++) {
    // Calculate the range of the current bucket
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor(i * bucketSize) + 1, totalPoints - 1);

    // Calculate the range of the next bucket (for the triangle area calculation)
    const nextBucketStart = Math.floor(i * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, totalPoints - 1);

    // Calculate the average point of the next bucket
    let avgX = 0;
    let avgY = 0;
    let count = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += xData[j];
      avgY += yData[j];
      count++;
    }
    avgX /= count;
    avgY /= count;

    // Find the point in the current bucket with the largest triangle area
    let maxArea = -1;
    let maxIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (xData[prevIndex] - avgX) * (yData[j] - yData[prevIndex]) -
        (xData[prevIndex] - xData[j]) * (avgY - yData[prevIndex])
      );

      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    resultX.push(xData[maxIndex]);
    resultY.push(yData[maxIndex]);
    prevIndex = maxIndex;
  }

  // Always include last point
  resultX.push(xData[totalPoints - 1]);
  resultY.push(yData[totalPoints - 1]);

  return { xData: resultX, yData: resultY };
}

/**
 * Simple min-max downsampling (faster than LTTB, good for very large datasets).
 * Divides data into buckets and keeps min/max from each bucket.
 *
 * @param xData - X-axis data array
 * @param yData - Y-axis data array
 * @param targetPoints - Desired number of output points (default: 2000)
 * @returns Downsampled { xData, yData } arrays
 */
export function downsampleMinMax(
  xData: number[],
  yData: number[],
  targetPoints: number = 2000
): { xData: number[]; yData: number[] } {
  const totalPoints = xData.length;

  if (totalPoints <= targetPoints || targetPoints < 2) {
    return { xData, yData };
  }

  const resultX: number[] = [];
  const resultY: number[] = [];

  const bucketSize = totalPoints / targetPoints;

  for (let i = 0; i < targetPoints; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(Math.floor((i + 1) * bucketSize), totalPoints);

    if (start >= end) continue;

    // Find min and max in this bucket
    let minIdx = start;
    let maxIdx = start;
    for (let j = start + 1; j < end; j++) {
      if (yData[j] < yData[minIdx]) minIdx = j;
      if (yData[j] > yData[maxIdx]) maxIdx = j;
    }

    // Add min first, then max (preserve order)
    if (minIdx <= maxIdx) {
      resultX.push(xData[minIdx]);
      resultY.push(yData[minIdx]);
      if (minIdx !== maxIdx) {
        resultX.push(xData[maxIdx]);
        resultY.push(yData[maxIdx]);
      }
    } else {
      resultX.push(xData[maxIdx]);
      resultY.push(yData[maxIdx]);
      resultX.push(xData[minIdx]);
      resultY.push(yData[minIdx]);
    }
  }

  return { xData: resultX, yData: resultY };
}

/**
 * Downsample waveform data if it exceeds the threshold.
 * Uses LTTB for medium-sized data, min-max for very large data.
 *
 * @param xData - X-axis data array
 * @param yData - Y-axis data array
 * @param threshold - Point count above which downsampling is applied (default: 5000)
 * @param targetPoints - Desired output point count (default: 2000)
 * @returns Downsampled { xData, yData } arrays
 */
export function downsampleIfNeeded(
  xData: number[],
  yData: number[],
  threshold: number = 5000,
  targetPoints: number = 2000
): { xData: number[]; yData: number[] } {
  if (xData.length <= threshold) {
    return { xData, yData };
  }

  // For very large datasets (>100k points), use min-max for speed
  if (xData.length > 100000) {
    return downsampleMinMax(xData, yData, targetPoints);
  }

  return downsampleLTTB(xData, yData, targetPoints);
}
