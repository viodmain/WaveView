import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 SPICE tr0 瞬态分析文件
 *
 * 格式：
 *  行1: 头信息（序列号 + 描述）
 *  行2: 版权信息
 *  行3: 标记值（如 0）
 *  行4: 列数标记（如 1 1 1 1 1 1）
 *  行5+: 列名（可能跨行，需要合并）
 *  数据行: 无空格分隔的科学计数法，用正负号分割
 */
export function parseTrFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  // 从行5开始收集列名（跳过空行），直到遇到数据行
  let nameLineIdx = 4;
  while (nameLineIdx < lines.length && lines[nameLineIdx].trim() === '') {
    nameLineIdx++;
  }

  let nameStr = '';
  let dataStartIdx = nameLineIdx;
  for (let i = nameLineIdx; i < lines.length; i++) {
    const line = lines[i];
    // 数据行以 + 或 - 开头，包含科学计数法
    if (/[+\-]\d+\.\d+e/i.test(line)) {
      dataStartIdx = i;
      break;
    }
    nameStr += ' ' + line;
    dataStartIdx = i + 1;
  }

  // 解析列名
  const rawNames = nameStr.trim().split(/\s{2,}/).filter(Boolean);

  // 从第一个数据行推断实际列数
  let numCols = rawNames.length;
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (nums && nums.length > 0) {
      numCols = nums.length;
      break;
    }
  }

  // 截取列名到实际列数
  const colNames = rawNames.slice(0, numCols);

  // 初始化各列数据
  const allValues: number[][] = Array.from({ length: numCols }, () => []);

  // 解析数据行
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (!nums || nums.length === 0) continue;

    // 跳过不完整的行（值数不是列数的整数倍）
    if (nums.length % numCols !== 0) continue;

    const values = nums.map(Number);
    for (let j = 0; j < values.length; j++) {
      allValues[j % numCols].push(values[j]);
    }
  }

  // 第一列是 TIME (X 轴)
  const xData = allValues[0];
  const waveforms: WaveformData[] = [];

  for (let i = 1; i < colNames.length; i++) {
    waveforms.push({
      name: colNames[i],
      xData,
      yData: allValues[i],
      unit: { x: 's', y: 'V' },
    });
  }

  return {
    filename,
    waveforms,
    metadata: { analysis: 'TRAN', colNames },
  };
}
