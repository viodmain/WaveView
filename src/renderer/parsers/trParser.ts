import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 SPICE tr0 瞬态分析文件
 *
 * 格式：
 *  行1-5: 仿真厂商信息（无重要信息）
 *  行6+: 数据数量记录（几个1就有几组数据，与列名数量一致）
 *  列名行: 波形名称，第一个为X轴（通常为TIME），$&%# 为结束符
 *  数据行: 无空格分隔的科学计数法，用正负号分割
 *  数据结束: 0.10000E+31 为结束符，不计入数据
 */
export function parseTrFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  // 跳过开头的空行和厂商信息，找到列名行
  // 列名行的特征：包含波形名称（如 TIME、u5_10），不是纯数字，不包含特殊字符
  let nameLineIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    // 跳过纯数字行（如 "0"、"1  1  1  1  1  1"）
    if (/^[\d\s]+$/.test(line)) continue;
    // 跳过包含 Copyright、日期或 * 的行（厂商信息）
    if (/Copyright|^\w{3}\s+\w{3}\s+\d+/.test(line)) continue;
    if (/\*/.test(line)) continue;
    // 找到列名行（包含 TIME 或类似的波形名称）
    if (/TIME|[a-z_]\w*/i.test(line)) {
      nameLineIdx = i;
      break;
    }
  }

  // 收集列名（可能跨多行，直到遇到数据行或 $&%#）
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

  // 解析列名：按多个空格分割，过滤掉 $&%# 结束符
  const rawNames = nameStr.trim().split(/\s{2,}/).filter(Boolean);
  const colNames = rawNames.filter((name) => name !== '$&%#');

  // 从第一个数据行推断实际列数
  let numCols = colNames.length;
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (nums && nums.length > 0) {
      numCols = nums.length;
      break;
    }
  }

  // 如果列名数量与数据列数不匹配，调整列名
  const finalColNames = colNames.length >= numCols
    ? colNames.slice(0, numCols)
    : [...colNames, ...Array.from({ length: numCols - colNames.length }, (_, i) => `col${i}`)];

  // 初始化各列数据
  const allValues: number[][] = Array.from({ length: numCols }, () => []);

  // 解析数据行
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    // 检查数据结束符 0.10000E+31
    if (/0\.10000E\+31/i.test(line)) break;

    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (!nums || nums.length === 0) continue;

    // 跳过不完整的行（值数不是列数的整数倍）
    if (nums.length % numCols !== 0) continue;

    const values = nums.map(Number);
    for (let j = 0; j < values.length; j++) {
      allValues[j % numCols].push(values[j]);
    }
  }

  // 第一列是 X 轴（通常是 TIME）
  const xData = allValues[0];
  const waveforms: WaveformData[] = [];

  for (let i = 1; i < finalColNames.length; i++) {
    waveforms.push({
      name: finalColNames[i],
      xData,
      yData: allValues[i],
      unit: { x: 's', y: 'V' },
    });
  }

  return {
    filename,
    waveforms,
    metadata: { analysis: 'TRAN', colNames: finalColNames },
  };
}
