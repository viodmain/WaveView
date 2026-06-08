/**
 * 文件解析 Worker
 *
 * 在后台线程执行文件解析，避免阻塞 UI
 */

// 需要在 Worker 中内联解析逻辑（Worker 无法直接 import 模块）
// 这里复制 trParser、acParser、spParser 的核心逻辑

interface ParsedFile {
  filename: string;
  waveforms: {
    name: string;
    xData: number[];
    yData: number[];
    unit: { x: string; y: string };
  }[];
  metadata: Record<string, unknown>;
}

// Worker 消息类型
interface ParseMessage {
  filename: string;
  content: string;
}

// 解析 tr0 文件（旧格式）
function parseTrOldFormat(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);

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

  let nameStr = '';
  let dataStartIdx = nameLineIdx;
  for (let i = nameLineIdx; i < lines.length; i++) {
    const line = lines[i];
    if (/[+\-]\d+\.\d+e/i.test(line)) {
      dataStartIdx = i;
      break;
    }
    if (line.includes('$&%#')) {
      nameStr += ' ' + line.split('$&%#')[0];
      dataStartIdx = i + 1;
      break;
    }
    nameStr += ' ' + line;
    dataStartIdx = i + 1;
  }

  const rawNames = nameStr.trim().split(/\s{2,}/).filter(Boolean);
  const colNames = rawNames.filter((name) => name !== '$&%#' && !/^\d+$/.test(name));
  const numCols = colNames.length;

  const allNumbers: number[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (/0\.10000E\+31/i.test(line)) break;
    const nums = line.match(/[+\-]?\d+\.\d+e[+\-]?\d+/gi);
    if (!nums) continue;
    for (const num of nums) allNumbers.push(Number(num));
  }

  const allValues: number[][] = Array.from({ length: numCols }, () => []);
  const completeGroups = Math.floor(allNumbers.length / numCols);
  for (let i = 0; i < completeGroups * numCols; i++) {
    allValues[i % numCols].push(allNumbers[i]);
  }

  const xData = allValues[0];
  const waveforms = [];
  for (let i = 1; i < colNames.length; i++) {
    waveforms.push({
      name: colNames[i],
      xData,
      yData: allValues[i],
      unit: { x: 's', y: 'V' },
    });
  }

  return { filename, waveforms, metadata: { analysis: 'TRAN', format: 'old', colNames } };
}

// 解析 tr0 文件（新格式）
function parseTrNewFormat(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);
  let nodeNames: string[] = [];
  const frequencies: number[] = [];
  const allValues: number[][] = [];

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
      if (matches) nodeNames = matches.map((m) => m.replace(/'/g, ''));
    } else if (line.startsWith('#C')) {
      let dataBlock = line.substring(2);
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
        dataBlock += ' ' + lines[i].trim();
      }
      const tokens = dataBlock.trim().split(/\s+/);
      if (tokens.length < 2) { i++; continue; }
      const time = parseFloat(tokens[0]);
      const numNodes = parseInt(tokens[1], 10);
      frequencies.push(time);
      const nodeData: number[] = [];
      for (let n = 0; n < numNodes; n++) {
        nodeData.push(parseFloat(tokens[2 + n] || '0'));
      }
      allValues.push(nodeData);
    } else if (line.startsWith('#;')) {
      i++;
      continue;
    }
    i++;
  }

  const waveforms = [];
  for (let n = 0; n < nodeNames.length; n++) {
    const yData: number[] = [];
    for (let f = 0; f < allValues.length; f++) {
      yData.push(allValues[f]?.[n] ?? 0);
    }
    waveforms.push({ name: nodeNames[n], xData: frequencies, yData, unit: { x: 's', y: 'V' } });
  }

  return { filename, waveforms, metadata: { analysis: 'TRAN', format: 'new', nodeNames } };
}

// 解析 tr0 文件
function parseTrFile(filename: string, content: string): ParsedFile {
  if (/^#[HNC]/m.test(content)) return parseTrNewFormat(filename, content);
  return parseTrOldFormat(filename, content);
}

// 解析 ac0 文件
function parseAcFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);
  let nodeNames: string[] = [];
  const frequencies: number[] = [];
  const allValues: number[][][] = [];

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
      if (matches) nodeNames = matches.map((m) => m.replace(/'/g, ''));
    } else if (line.startsWith('#C')) {
      let dataBlock = line.substring(2);
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
        dataBlock += ' ' + lines[i].trim();
      }
      const rawTokens = dataBlock.trim().split(/\s+/);
      const tokens: string[] = [];
      for (const t of rawTokens) {
        if (t.startsWith('/') && t.length > 1) { tokens.push('/'); tokens.push(t.substring(1)); }
        else tokens.push(t);
      }
      if (tokens.length < 2) { i++; continue; }
      const freq = parseFloat(tokens[0]);
      const numNodes = parseInt(tokens[1], 10);
      frequencies.push(freq);
      const nodeValues: number[][] = [];
      let tokenIdx = 2;
      for (let n = 0; n < numNodes && tokenIdx < tokens.length; n++) {
        if (tokens[tokenIdx] === '/') tokenIdx++;
        const re = parseFloat(tokens[tokenIdx] || '0');
        tokenIdx++;
        if (tokenIdx < tokens.length && tokens[tokenIdx] === '/') tokenIdx++;
        let im = 0;
        if (tokenIdx < tokens.length && tokens[tokenIdx] !== '/') {
          const val = parseFloat(tokens[tokenIdx]);
          if (!isNaN(val)) { im = val; tokenIdx++; }
        }
        nodeValues.push([re, im]);
      }
      allValues.push(nodeValues);
    }
    i++;
  }

  const waveforms = [];
  for (let n = 0; n < nodeNames.length; n++) {
    const yData: number[] = [];
    for (let f = 0; f < allValues.length; f++) {
      const nodeVal = allValues[f]?.[n];
      if (nodeVal) yData.push(Math.sqrt(nodeVal[0] ** 2 + nodeVal[1] ** 2));
      else yData.push(0);
    }
    waveforms.push({ name: nodeNames[n], xData: frequencies, yData, unit: { x: 'Hz', y: 'V' } });
  }

  return { filename, waveforms, metadata: { analysis: 'AC', nodeNames } };
}

// 解析 s*p 文件
function parseSpFile(filename: string, content: string): ParsedFile {
  const lines = content.split(/\r?\n/);
  const portMatch = filename.match(/\.s(\d+)p$/i);
  const numPorts = portMatch ? parseInt(portMatch[1], 10) : 2;
  const numParams = numPorts * numPorts;
  const tokensPerFreq = 1 + numParams * 2;

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
        if (['HZ', 'KHZ', 'MHZ', 'GHZ'].includes(p)) freqUnit = p;
        else if (['RI', 'MA', 'DB'].includes(p)) format = p;
        else if (p === 'R' && i + 1 < parts.length) { refImpedance = parseFloat(parts[i + 1]); i++; }
      }
    } else dataLines.push(trimmed);
  }

  const mergedBlocks: string[] = [];
  let currentTokens: string[] = [];
  for (const line of dataLines) {
    currentTokens.push(...line.split(/\s+/));
    while (currentTokens.length >= tokensPerFreq) {
      mergedBlocks.push(currentTokens.slice(0, tokensPerFreq).join(' '));
      currentTokens = currentTokens.slice(tokensPerFreq);
    }
  }

  const frequencies: number[] = [];
  const paramValues: number[][][] = [];
  for (const block of mergedBlocks) {
    const tokens = block.trim().split(/\s+/).map(Number);
    if (tokens.length < tokensPerFreq) continue;
    frequencies.push(tokens[0]);
    const params: number[][] = [];
    for (let p = 0; p < numParams; p++) {
      const idx = 1 + p * 2;
      let re = tokens[idx] || 0;
      let im = tokens[idx + 1] || 0;
      if (format === 'MA') { const mag = re; const phase = (im * Math.PI) / 180; re = mag * Math.cos(phase); im = mag * Math.sin(phase); }
      else if (format === 'DB') { const mag = Math.pow(10, re / 20); const phase = (im * Math.PI) / 180; re = mag * Math.cos(phase); im = mag * Math.sin(phase); }
      params.push([re, im]);
    }
    paramValues.push(params);
  }

  const waveforms = [];
  for (let p = 0; p < numParams; p++) {
    const row = Math.floor(p / numPorts) + 1;
    const col = (p % numPorts) + 1;
    const yData: number[] = [];
    for (let f = 0; f < paramValues.length; f++) {
      const [re, im] = paramValues[f][p];
      const mag = Math.sqrt(re * re + im * im);
      yData.push(20 * Math.log10(Math.max(mag, 1e-30)));
    }
    waveforms.push({ name: `S${row}${col} (dB)`, xData: frequencies, yData, unit: { x: freqUnit.toLowerCase(), y: 'dB' } });
  }

  return { filename, waveforms, metadata: { analysis: 'SP', numPorts, format, refImpedance, freqUnit } };
}

// 主解析函数
function parseFile(filename: string, content: string): ParsedFile {
  if (/\.tr\d+$/i.test(filename)) return parseTrFile(filename, content);
  if (/\.ac\d+$/i.test(filename)) return parseAcFile(filename, content);
  if (/\.s\d+p$/i.test(filename)) return parseSpFile(filename, content);
  throw new Error(`Unsupported file format: ${filename}`);
}

// Worker 消息处理
self.onmessage = (e: MessageEvent<ParseMessage>) => {
  const { filename, content } = e.data;
  try {
    const result = parseFile(filename, content);
    self.postMessage({ success: true, result });
  } catch (err) {
    self.postMessage({ success: false, error: String(err) });
  }
};
