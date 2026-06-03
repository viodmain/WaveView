import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 SPICE tr0 瞬态分析文件
 *
 * 格式：
 *  行1-5: 仿真厂商信息（无重要信息）
 *  数据数量记录: 几个1就有几组数据，与列名数量一致
 *  列名行: 波形名称，第一个为X轴（通常为TIME），$&%# 为结束符
 *  数据行: 无空格分隔的科学计数法，用正负号分割
 *  数据结束: 0.10000E+31 为结束符，不计入数据
 *
 * 重要：数据可能跨行分布，不能按行匹配。正确方式：
 *  1. 先切分所有数据为一个数组
 *  2. 按顺序每 N 个一组（N = 列数），分别存入各波形
 */
export function parseTrFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  // 跳过开头的空行和厂商信息，找到列名行
  let nameLineIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (/^[\d\s]+$/.test(line)) continue;
    if (/Copyright|^\w{3}\s+\w{3}\s+\d+/.test(line)) continue;
    if (/\*/.test(line)) continue;
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
  const numCols = colNames.length;

  // 收集所有数据值（先切分为一个大数组，不分割到各行）
  const allNumbers: number[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    // 检查数据结束符 0.10000E+31
    if (/0\.10000E\+31/i.test(line)) break;

    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (!nums) continue;

    for (const num of nums) {
      allNumbers.push(Number(num));
    }
  }

  // 按顺序每 numCols 个一组，分别存入各波形
  // 丢弃最后一组不完整的数据
  const allValues: number[][] = Array.from({ length: numCols }, () => []);
  const completeGroups = Math.floor(allNumbers.length / numCols);
  for (let i = 0; i < completeGroups * numCols; i++) {
    allValues[i % numCols].push(allNumbers[i]);
  }

  // 第一列是 X 轴（通常是 TIME）
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
