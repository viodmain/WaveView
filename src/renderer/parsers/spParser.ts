import type { ParsedFile, WaveformData } from '../../shared/types';

/**
 * 解析 Touchstone s*p 文件（S 参数）
 *
 * 格式：
 *  ! 开头：注释行
 *  # 行：格式定义（频率单位 参数类型 格式 参考阻抗）
 *  数据行：频率 值1 值2 ...（可能跨多行）
 *
 * 支持：RI（实部/虚部）、MA（幅度/相位）、DB（dB/相位）
 */
export function parseSpFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

  // 从文件名推断端口数
  const portMatch = filename.match(/\.s(\d+)p$/i);
  const numPorts = portMatch ? parseInt(portMatch[1], 10) : 2;
  const numParams = numPorts * numPorts;
  const tokensPerFreq = 1 + numParams * 2; // 频率 + S参数实虚部

  // 解析 # 行：格式定义
  let freqUnit = 'HZ';
  let format = 'RI';
  let refImpedance = 50;

  const dataLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('!')) continue;

    if (trimmed.startsWith('#')) {
      const parts = trimmed.substring(1).trim().split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i].toUpperCase();
        if (['HZ', 'KHZ', 'MHZ', 'GHZ'].includes(p)) {
          freqUnit = p;
        } else if (['S', 'Y', 'Z', 'G', 'H'].includes(p)) {
          // 参数类型，忽略
        } else if (['RI', 'MA', 'DB'].includes(p)) {
          format = p;
        } else if (p === 'R' && i + 1 < parts.length) {
          refImpedance = parseFloat(parts[i + 1]);
          i++;
        }
      }
    } else {
      dataLines.push(trimmed);
    }
  }

  // 合并续行：当 token 数量不足时继续合并
  const mergedBlocks: string[] = [];
  let currentTokens: string[] = [];

  for (const line of dataLines) {
    const tokens = line.split(/\s+/);
    currentTokens.push(...tokens);

    // 当 token 数量足够时，形成一个 block
    while (currentTokens.length >= tokensPerFreq) {
      mergedBlocks.push(currentTokens.slice(0, tokensPerFreq).join(' '));
      currentTokens = currentTokens.slice(tokensPerFreq);
    }
  }

  // 解析数据
  const frequencies: number[] = [];
  const paramValues: number[][][] = []; // [freqIdx][paramIdx][re, im]

  for (const block of mergedBlocks) {
    const tokens = block.trim().split(/\s+/).map(Number);
    if (tokens.length < tokensPerFreq) continue;

    const freq = tokens[0];
    frequencies.push(freq);

    const params: number[][] = [];
    for (let p = 0; p < numParams; p++) {
      const idx = 1 + p * 2;
      let re = tokens[idx] || 0;
      let im = tokens[idx + 1] || 0;

      // MA 格式：幅度 + 相位(度) → 实部 + 虚部
      if (format === 'MA') {
        const mag = re;
        const phase = (im * Math.PI) / 180;
        re = mag * Math.cos(phase);
        im = mag * Math.sin(phase);
      }
      // DB 格式：dB + 相位(度) → 实部 + 虚部
      else if (format === 'DB') {
        const mag = Math.pow(10, re / 20);
        const phase = (im * Math.PI) / 180;
        re = mag * Math.cos(phase);
        im = mag * Math.sin(phase);
      }

      params.push([re, im]);
    }
    paramValues.push(params);
  }

  // 生成 S 参数名称：S11, S21, S12, S22, ...
  const waveforms: WaveformData[] = [];

  for (let p = 0; p < numParams; p++) {
    const row = Math.floor(p / numPorts) + 1;
    const col = (p % numPorts) + 1;
    const paramName = `S${row}${col}`;

    // 幅度 (dB)
    const yDataDb: number[] = [];
    // 相位 (度)
    const yDataPhase: number[] = [];

    for (let f = 0; f < paramValues.length; f++) {
      const [re, im] = paramValues[f][p];
      const mag = Math.sqrt(re * re + im * im);
      yDataDb.push(20 * Math.log10(Math.max(mag, 1e-30)));
      yDataPhase.push((Math.atan2(im, re) * 180) / Math.PI);
    }

    waveforms.push({
      name: `${paramName} (dB)`,
      xData: frequencies,
      yData: yDataDb,
      unit: { x: freqUnit.toLowerCase(), y: 'dB' },
    });
  }

  return {
    filename,
    waveforms,
    metadata: { analysis: 'SP', numPorts, format, refImpedance, freqUnit },
  };
}
