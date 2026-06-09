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
 * 自动计算位周期
 *
 * 通过检测信号的过零点来估算位周期。
 *
 * @param xData 时间轴数据
 * @param yData 信号数据
 * @returns 估算的位周期（秒），如果无法估算返回 0
 */
export function autoDetectBitPeriod(xData: number[], yData: number[]): number {
  if (xData.length < 10) return 0;

  // 计算信号均值
  const mean = yData.reduce((sum, y) => sum + y, 0) / yData.length;

  // 检测过零点（信号从低于均值变为高于均值，或反之）
  const crossings: number[] = [];
  for (let i = 1; i < yData.length; i++) {
    const prev = yData[i - 1] - mean;
    const curr = yData[i] - mean;
    if ((prev < 0 && curr >= 0) || (prev >= 0 && curr < 0)) {
      // 线性插值找到精确的过零点时间
      const ratio = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
      const t = xData[i - 1] + ratio * (xData[i] - xData[i - 1]);
      crossings.push(t);
    }
  }

  if (crossings.length < 2) return 0;

  // 计算相邻过零点的时间间隔
  const intervals: number[] = [];
  for (let i = 1; i < crossings.length; i++) {
    intervals.push(crossings[i] - crossings[i - 1]);
  }

  // 使用中位数作为位周期（更鲁棒）
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];

  // 位周期通常是过零点间隔的 2 倍（一个周期包含两个过零点）
  return medianInterval * 2;
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
  const totalPeriods = Math.floor(totalTime / bitPeriod) - 1; // -1 因为每个 trace 需要 2 个 UI
  const periodsToUse = numPeriods > 0 ? Math.min(numPeriods, totalPeriods) : totalPeriods;

  if (periodsToUse <= 0) {
    return { traces: [], metrics: { eyeHeight: 0, eyeWidth: 0, numTraces: 0 } };
  }

  // 对数据进行插值，确保每个 UI 有相同的采样点数
  const samplesPerUI = 200; // 每个 UI 200 个采样点
  const samplesPerTrace = samplesPerUI * 2; // 每个 trace 2 个 UI
  const dt = bitPeriod / samplesPerUI;

  // 生成插值后的时间和信号值（覆盖所有需要的数据范围）
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
  // X 轴归一化到 [0, 2]，表示 2 个 UI
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
 *
 * 眼图中心在 1.0 UI 处（2 个 UI 的中间）
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

  // 眼图中心在 1.0 UI 处（2 个 UI 的中间）
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

  // 计算眼宽：使用 0.5 眼高处的宽度
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

  // 眼宽归一化到 UI 单位
  const eyeWidth = (rightEdge - leftEdge) / numPoints * 2; // ×2 因为总范围是 2 UI

  return { eyeHeight, eyeWidth, numTraces };
}
