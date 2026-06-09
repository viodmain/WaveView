/**
 * 眼图 (Eye Diagram) 数据处理
 *
 * 将数字信号按位周期切分，然后叠加显示。
 * 标准眼图长度为 2 个 UI (Unit Interval)。
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
 * 自动计算位周期（使用自相关方法）
 *
 * 自相关对连续相同的值（如 111 000）不敏感，
 * 因为它分析的是信号的整体周期性。
 *
 * @param xData 时间轴数据
 * @param yData 信号数据
 * @returns 估算的位周期（秒），如果无法估算返回 0
 */
export function autoDetectBitPeriod(xData: number[], yData: number[]): number {
  if (xData.length < 100) return 0;

  // 计算采样间隔
  const dt = (xData[xData.length - 1] - xData[0]) / (xData.length - 1);

  // 去除直流分量（减去均值）
  const mean = yData.reduce((sum, y) => sum + y, 0) / yData.length;
  const signal = yData.map((y) => y - mean);

  // 计算自相关（只计算前半部分，节省计算量）
  const maxLag = Math.min(Math.floor(signal.length / 2), 10000);
  const autocorr: number[] = [];
  const variance = signal.reduce((sum, y) => sum + y * y, 0) / signal.length;

  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < signal.length - lag; i++) {
      sum += signal[i] * signal[i + lag];
    }
    autocorr.push(sum / (signal.length - lag) / variance);
  }

  // 找到第一个峰值（排除 lag=0 的自相关峰）
  // 从 lag=10 开始找，避免噪声干扰
  const minLag = Math.max(10, Math.floor(maxLag * 0.01));
  let peakLag = 0;
  let peakValue = -Infinity;

  // 找局部最大值
  for (let i = minLag; i < maxLag - 1; i++) {
    if (autocorr[i] > autocorr[i - 1] && autocorr[i] > autocorr[i + 1]) {
      if (autocorr[i] > peakValue) {
        peakValue = autocorr[i];
        peakLag = i;
      }
    }
  }

  // 如果找到明显的峰值，返回对应的周期
  if (peakLag > 0 && peakValue > 0.1) {
    return peakLag * dt;
  }

  // 备用方法：过零点检测
  return autoDetectBitPeriodByCrossing(xData, yData);
}

/**
 * 过零点检测（备用方法）
 */
function autoDetectBitPeriodByCrossing(xData: number[], yData: number[]): number {
  if (xData.length < 10) return 0;

  const mean = yData.reduce((sum, y) => sum + y, 0) / yData.length;

  // 检测上升沿（从低到高的跳变）
  const risingEdges: number[] = [];
  for (let i = 1; i < yData.length; i++) {
    const prev = yData[i - 1] - mean;
    const curr = yData[i] - mean;
    if (prev < 0 && curr >= 0) {
      const ratio = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
      const t = xData[i - 1] + ratio * (xData[i] - xData[i - 1]);
      risingEdges.push(t);
    }
  }

  if (risingEdges.length < 2) return 0;

  // 计算相邻上升沿的时间间隔
  const intervals: number[] = [];
  for (let i = 1; i < risingEdges.length; i++) {
    intervals.push(risingEdges[i] - risingEdges[i - 1]);
  }

  // 使用中位数作为位周期
  intervals.sort((a, b) => a - b);
  return intervals[Math.floor(intervals.length / 2)];
}

/**
 * 生成眼图数据
 *
 * 标准眼图：每个 trace 跨越 2 个 UI，X 轴范围 [0, 2]
 * 相邻 trace 之间偏移 1 个 UI，形成叠加效果。
 *
 * @param xData 时间轴数据
 * @param yData 信号数据
 * @param bitPeriod 位周期 / UI（秒）
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

  // 计算完整的周期数（每个 trace 跨越 2 个 UI，偏移 1 个 UI）
  const totalPeriods = Math.floor(totalTime / bitPeriod) - 1;
  const periodsToUse = numPeriods > 0 ? Math.min(numPeriods, totalPeriods) : totalPeriods;

  if (periodsToUse <= 0) {
    return { traces: [], metrics: { eyeHeight: 0, eyeWidth: 0, numTraces: 0 } };
  }

  // 对数据进行插值，确保每个 UI 有相同的采样点数
  const samplesPerUI = 200;
  const samplesPerTrace = samplesPerUI * 2; // 2 个 UI
  const dt = bitPeriod / samplesPerUI;

  // 生成插值后的时间和信号值
  const totalSamples = samplesPerUI * (periodsToUse + 1);
  const interpolatedX: number[] = [];
  const interpolatedY: number[] = [];

  for (let i = 0; i < totalSamples; i++) {
    const t = tMin + i * dt;
    interpolatedX.push(t);
    const y = interpolate(xData, yData, t);
    interpolatedY.push(y);
  }

  // 切分并叠加
  const traces: Array<{ x: number[]; y: number[] }> = [];
  const phaseX: number[] = Array.from({ length: samplesPerTrace }, (_, i) => i / samplesPerUI);

  for (let p = 0; p < periodsToUse; p++) {
    const startIdx = p * samplesPerUI;
    const endIdx = startIdx + samplesPerTrace;

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

  // 眼图中心在 1.0 UI 处
  const centerIdx = Math.floor(numPoints * 0.5);

  // 计算眼高
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const trace of traces) {
    if (centerIdx < trace.y.length) {
      yMin = Math.min(yMin, trace.y[centerIdx]);
      yMax = Math.max(yMax, trace.y[centerIdx]);
    }
  }
  const eyeHeight = yMax - yMin;

  // 计算眼宽
  const yMid = (yMin + yMax) / 2;
  let leftEdge = 0;
  let rightEdge = numPoints - 1;

  for (let i = centerIdx; i > 0; i--) {
    const avgY = traces.reduce((sum, t) => sum + t.y[i], 0) / numTraces;
    if (avgY < yMid) {
      leftEdge = i;
      break;
    }
  }

  for (let i = centerIdx; i < numPoints; i++) {
    const avgY = traces.reduce((sum, t) => sum + t.y[i], 0) / numTraces;
    if (avgY < yMid) {
      rightEdge = i;
      break;
    }
  }

  const eyeWidth = (rightEdge - leftEdge) / numPoints * 2;

  return { eyeHeight, eyeWidth, numTraces };
}
