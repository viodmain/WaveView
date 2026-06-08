/**
 * LTTB (Largest Triangle Three Buckets) 降采样算法
 *
 * 在保持曲线形状的前提下，将数据点减少到指定数量。
 * 适用于波形显示场景。
 */

/**
 * 计算三角形面积（用于 LTTB 算法）
 */
function triangleArea(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  return Math.abs((ax - cx) * (by - ay) - (ax - bx) * (cy - ay)) * 0.5;
}

/**
 * LTTB 降采样
 *
 * @param xData X 轴数据
 * @param yData Y 轴数据
 * @param targetPoints 目标数据点数量
 * @returns 降采样后的 [xData, yData]
 */
export function downsampleLTTB(
  xData: number[],
  yData: number[],
  targetPoints: number,
): [number[], number[]] {
  const dataLen = xData.length;

  // 数据量小于目标数量，直接返回
  if (dataLen <= targetPoints) {
    return [xData, yData];
  }

  const resultX: number[] = [];
  const resultY: number[] = [];

  // 始终保留第一个点
  resultX.push(xData[0]);
  resultY.push(yData[0]);

  const bucketSize = (dataLen - 2) / (targetPoints - 2);

  let prevIndex = 0;

  for (let i = 1; i < targetPoints - 1; i++) {
    // 当前桶的范围
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor(i * bucketSize) + 1, dataLen - 1);

    // 下一个桶的平均点
    const nextBucketStart = Math.floor(i * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, dataLen - 1);

    let avgX = 0;
    let avgY = 0;
    let nextBucketLen = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += xData[j];
      avgY += yData[j];
      nextBucketLen++;
    }
    if (nextBucketLen > 0) {
      avgX /= nextBucketLen;
      avgY /= nextBucketLen;
    }

    // 在当前桶中找到面积最大的点
    let maxArea = -1;
    let maxIndex = bucketStart;

    const prevX = xData[prevIndex];
    const prevY = yData[prevIndex];

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = triangleArea(prevX, prevY, xData[j], yData[j], avgX, avgY);
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    resultX.push(xData[maxIndex]);
    resultY.push(yData[maxIndex]);
    prevIndex = maxIndex;
  }

  // 始终保留最后一个点
  resultX.push(xData[dataLen - 1]);
  resultY.push(yData[dataLen - 1]);

  return [resultX, resultY];
}

/**
 * 智能降采样：根据数据量自动决定目标点数
 *
 * @param xData X 轴数据
 * @param yData Y 轴数据
 * @param maxPoints 最大数据点数量（默认 5000）
 * @returns 降采样后的 [xData, yData]
 */
export function autoDownsample(
  xData: number[],
  yData: number[],
  maxPoints: number = 5000,
): [number[], number[]] {
  if (xData.length <= maxPoints) {
    return [xData, yData];
  }
  return downsampleLTTB(xData, yData, maxPoints);
}
