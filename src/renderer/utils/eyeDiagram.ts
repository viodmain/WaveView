/**
 * 眼图 (Eye Diagram) 数据处理
 *
 * 将数字信号按位周期切分，然后叠加显示。
 */

export interface EyeDiagramData {
  /** 叠加后的数据，每个元素是一条曲线 [x[], y[]] */
  traces: Array<{ x: number[]; y: number[] }>;
  /** 眼图参数 */
  metrics: {
    eyeHeight: number;    // 眼高
    eyeWidth: number;     // 眼宽
    numTraces: number;    // 叠加的曲线数量
  };
}

/**
 * 生成眼图数据
 *
 * @param xData 时间轴数据
 * @param yData 信号数据
 * @param bitPeriod 位周期（秒）
 * @param numPeriods 叠加的周期数量（0 = 全部）
 * @returns 眼图数据
 */
export function generateEyeDiagram(
  xData: number[],
  yData: number[],
  bitPeriod: number,
  numPeriods: number = 0,
): EyeDiagramData {
  if (xData.length === 0 || bitPeriod <= 0) {
    return { traces: [], metrics: { eyeHeight: 0, eyeWidth: 0, numTraces: 0 } };
  }

  // 计算时间范围
  const tMin = xData[0];
  const tMax = xData[xData.length - 1];
  const totalTime = tMax - tMin;

  // 计算完整的周期数
  const totalPeriods = Math.floor(totalTime / bitPeriod);
  const periodsToUse = numPeriods > 0 ? Math.min(numPeriods, totalPeriods) : totalPeriods;

  if (periodsToUse <= 0) {
    return { traces: [], metrics: { eyeHeight: 0, eyeWidth: 0, numTraces: 0 } };
  }

  // 对数据进行插值，确保每个周期有相同的采样点数
  const samplesPerPeriod = Math.max(100, Math.round((xData.length / totalPeriods) * 2));
  const dt = bitPeriod / samplesPerPeriod;

  // 生成插值后的时间和信号值
  const interpolatedX: number[] = [];
  const interpolatedY: number[] = [];

  for (let i = 0; i < samplesPerPeriod * periodsToUse; i++) {
    const t = tMin + i * dt;
    interpolatedX.push(t);

    // 线性插值获取信号值
    const y = interpolate(xData, yData, t);
    interpolatedY.push(y);
  }

  // 切分并叠加
  const traces: Array<{ x: number[]; y: number[] }> = [];
  const phaseX: number[] = Array.from({ length: samplesPerPeriod }, (_, i) => i * dt / bitPeriod);

  for (let p = 0; p < periodsToUse; p++) {
    const startIdx = p * samplesPerPeriod;
    const endIdx = startIdx + samplesPerPeriod;

    if (endIdx > interpolatedY.length) break;

    const y = interpolatedY.slice(startIdx, endIdx);
    traces.push({ x: phaseX, y });
  }

  // 计算眼图参数
  const metrics = calculateEyeMetrics(traces);

  return { traces, metrics };
}

/**
 * 线性插值
 */
function interpolate(xData: number[], yData: number[], t: number): number {
  // 二分查找
  let low = 0;
  let high = xData.length - 1;

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (xData[mid] <= t) low = mid;
    else high = mid;
  }

  const x0 = xData[low];
  const x1 = xData[high];
  const y0 = yData[low];
  const y1 = yData[high];

  if (x1 === x0) return y0;

  // 线性插值
  const ratio = (t - x0) / (x1 - x0);
  return y0 + ratio * (y1 - y0);
}

/**
 * 计算眼图参数（眼高、眼宽）
 */
function calculateEyeMetrics(traces: Array<{ x: number[]; y: number[] }>): {
  eyeHeight: number;
  eyeWidth: number;
  numTraces: number;
} {
  if (traces.length === 0) {
    return { eyeHeight: 0, eyeWidth: 0, numTraces: 0 };
  }

  const numTraces = traces.length;
  const numPoints = traces[0].x.length;

  // 找到眼图张开最大的位置（通常在 0.5 位周期处）
  const centerIdx = Math.floor(numPoints * 0.5);

  // 计算眼高：在中心位置，所有曲线的最大值和最小值之差
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const trace of traces) {
    if (centerIdx < trace.y.length) {
      yMin = Math.min(yMin, trace.y[centerIdx]);
      yMax = Math.max(yMax, trace.y[centerIdx]);
    }
  }
  const eyeHeight = yMax - yMin;

  // 计算眼宽：简化计算，使用 0.5 眼高处的宽度
  const yMid = (yMin + yMax) / 2;
  let leftEdge = 0;
  let rightEdge = numPoints - 1;

  // 从中心向左找交叉点
  for (let i = centerIdx; i > 0; i--) {
    const avgY = traces.reduce((sum, t) => sum + t.y[i], 0) / numTraces;
    if (avgY < yMid) {
      leftEdge = i;
      break;
    }
  }

  // 从中心向右找交叉点
  for (let i = centerIdx; i < numPoints; i++) {
    const avgY = traces.reduce((sum, t) => sum + t.y[i], 0) / numTraces;
    if (avgY < yMid) {
      rightEdge = i;
      break;
    }
  }

  const eyeWidth = (rightEdge - leftEdge) / numPoints;

  return { eyeHeight, eyeWidth, numTraces };
}
