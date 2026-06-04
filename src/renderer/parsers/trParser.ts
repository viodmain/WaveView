import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 SPICE tr0 瞬态分析文件
 *
 * 支持两种格式：
 *
 * 格式1（旧格式）：
 *  行1-5: 仿真厂商信息
 *  计数行: 纯数字行（如 1 1 1 1 1 15 15 15 1）—— 跳过
 *  列名行: 波形名称，第一个为X轴（通常为TIME），$&%# 为结束符
 *  数据行: 无空格分隔的科学计数法，用正负号分割
 *  数据结束: 0.10000E+31 为结束符
 *
 * 格式2（新格式，与 ac0 类似）：
 *  #H - 头信息块
 *  #N - 节点名称列表
 *  #C - 数据块：时间 节点数 值1 值2 ...
 *  #; - 结束符（可能出现在数据中间，跳过）
 */
export function parseTrFile(filename: string, content: string): ParsedFile {
  // 检测格式：是否包含 #H 或 #N 或 #C
  if (/^#[HNC]/m.test(content)) {
    return parseTrNewFormat(filename, content);
  }
  return parseTrOldFormat(filename, content);
}

/**
 * 解析新格式 tr0（#H/#N/#C 格式，与 ac0 类似但数据为实数）
 */
function parseTrNewFormat(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  let nodeNames: string[] = [];
  const frequencies: number[] = [];
  const allValues: number[][] = []; // [freqIdx][nodeIdx]

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('#N')) {
      // 解析节点名
      let nameBlock = line.substring(2);
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
        nameBlock += ' ' + lines[i].trim();
      }
      const matches = nameBlock.match(/'([^']+)'/g);
      if (matches) {
        nodeNames = matches.map((m) => m.replace(/'/g, ''));
      }
    } else if (line.startsWith('#C')) {
      // 解析数据块
      let dataBlock = line.substring(2);
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
        dataBlock += ' ' + lines[i].trim();
      }

      const tokens = dataBlock.trim().split(/\s+/);
      if (tokens.length < 2) {
        i++;
        continue;
      }

      const time = parseFloat(tokens[0]);
      const numNodes = parseInt(tokens[1], 10);
      frequencies.push(time);

      const nodeData: number[] = [];
      for (let n = 0; n < numNodes; n++) {
        const val = parseFloat(tokens[2 + n] || '0');
        nodeData.push(val);
      }
      allValues.push(nodeData);
    } else if (line.startsWith('#;')) {
      // 跳过结束符，继续解析后续数据
      i++;
      continue;
    }

    i++;
  }

  // 构建波形数据
  const waveforms: WaveformData[] = [];
  const xData = frequencies;

  for (let n = 0; n < nodeNames.length; n++) {
    const yData: number[] = [];
    for (let f = 0; f < allValues.length; f++) {
      yData.push(allValues[f]?.[n] ?? 0);
    }

    waveforms.push({
      name: nodeNames[n],
      xData,
      yData,
      unit: { x: 's', y: 'V' },
    });
  }

  return {
    filename,
    waveforms,
    metadata: { analysis: 'TRAN', format: 'new', nodeNames },
  };
}

/**
 * 解析旧格式 tr0（无空格科学计数法）
 */
function parseTrOldFormat(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  // 跳过开头的空行和厂商信息，找到列名行
  // 列名行特征：包含波形名称（如 TIME），不是纯数字，不包含 Copyright
  let nameLineIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    // 跳过纯数字行（计数行）
    if (/^[\d\s]+$/.test(line)) continue;
    if (/Copyright|^\w{3}\s+\w{3}\s+\d+/.test(line)) continue;
    if (/\*/.test(line)) continue;
    // 找到列名行
    if (/TIME|[a-z_]\w*/i.test(line)) {
      nameLineIdx = i;
      break;
    }
  }

  // 收集列名（可能跨多行，直到遇到 $&%# 或数据行）
  let nameStr = '';
  let dataStartIdx = nameLineIdx;
  for (let i = nameLineIdx; i < lines.length; i++) {
    const line = lines[i];
    // 数据行以 + 或 - 开头，包含科学计数法
    if (/[+\-]\d+\.\d+e/i.test(line)) {
      dataStartIdx = i;
      break;
    }
    // 遇到 $&%# 结束符，停止收集列名
    if (line.includes('$&%#')) {
      // 把 $&%# 之前的部分也加入
      const beforeEnd = line.split('$&%#')[0];
      nameStr += ' ' + beforeEnd;
      dataStartIdx = i + 1;
      break;
    }
    nameStr += ' ' + line;
    dataStartIdx = i + 1;
  }

  // 解析列名：按多个空格分割，过滤掉空值、$&%#、纯数字
  const rawNames = nameStr.trim().split(/\s{2,}/).filter(Boolean);
  const colNames = rawNames.filter((name) => name !== '$&%#' && !/^\d+$/.test(name));
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
    metadata: { analysis: 'TRAN', format: 'old', colNames },
  };
}
