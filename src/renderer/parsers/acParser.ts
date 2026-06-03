import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 SPICE ac0 交流分析文件
 *
 * 格式：
 *  #H - 头信息块（多行）
 *  #N - 节点名称列表（可能跨行）
 *  #C - 数据块：频率 节点数 实部/虚部 实部/虚部 ...
 */
export function parseAcFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  let nodeNames: string[] = [];
  const frequencies: number[] = [];
  const allValues: number[][][] = []; // [freqIdx][nodeIdx][re, im]

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('#N')) {
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
      let dataBlock = line.substring(2);
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
        dataBlock += ' ' + lines[i].trim();
      }

      // 将所有 token 展开：拆分 "/值" 为 "/" 和 "值"
      const rawTokens = dataBlock.trim().split(/\s+/);
      const tokens: string[] = [];
      for (const t of rawTokens) {
        if (t.startsWith('/') && t.length > 1) {
          tokens.push('/');
          tokens.push(t.substring(1));
        } else {
          tokens.push(t);
        }
      }

      if (tokens.length < 2) {
        i++;
        continue;
      }

      const freq = parseFloat(tokens[0]);
      const numNodes = parseInt(tokens[1], 10);
      frequencies.push(freq);

      const nodeValues: number[][] = [];
      let tokenIdx = 2;

      for (let n = 0; n < numNodes && tokenIdx < tokens.length; n++) {
        // 跳过 /
        if (tokens[tokenIdx] === '/') {
          tokenIdx++;
        }

        const re = parseFloat(tokens[tokenIdx] || '0');
        tokenIdx++;

        // 跳过 /
        if (tokenIdx < tokens.length && tokens[tokenIdx] === '/') {
          tokenIdx++;
        }

        let im = 0;
        if (tokenIdx < tokens.length && tokens[tokenIdx] !== '/') {
          const val = parseFloat(tokens[tokenIdx]);
          if (!isNaN(val)) {
            im = val;
            tokenIdx++;
          }
        }

        nodeValues.push([re, im]);
      }
      allValues.push(nodeValues);
    }

    i++;
  }

  // 构建波形数据
  const waveforms: WaveformData[] = [];
  const xData = frequencies;

  for (let n = 0; n < nodeNames.length; n++) {
    const yData: number[] = [];
    for (let f = 0; f < allValues.length; f++) {
      const nodeVal = allValues[f]?.[n];
      if (nodeVal) {
        const mag = Math.sqrt(nodeVal[0] ** 2 + nodeVal[1] ** 2);
        yData.push(mag);
      } else {
        yData.push(0);
      }
    }

    waveforms.push({
      name: nodeNames[n],
      xData,
      yData,
      unit: { x: 'Hz', y: 'V' },
    });
  }

  return {
    filename,
    waveforms,
    metadata: { analysis: 'AC', nodeNames },
  };
}
