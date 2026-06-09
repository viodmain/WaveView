import { useRef, useMemo, useState, useCallback } from 'react';
import { message, Button, InputNumber, Space, Tooltip, Select } from 'antd';
import { EyeOutlined, LineChartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import EChartsWrapper, { type EChartsHandle } from './EChartsWrapper';
import EyeChart from './EyeChart';
import { useFileStore } from '../../stores/fileStore';
import { useWindowStore } from '../../stores/windowStore';
import { autoDetectBitPeriod } from '../../utils/eyeDiagram';

const timeUnitOptions = [
  { value: 1e-12, label: 'ps' },
  { value: 1e-9, label: 'ns' },
  { value: 1e-6, label: 'us' },
  { value: 1e-3, label: 'ms' },
  { value: 1, label: 's' },
];

interface PlotAreaProps {
  onChartRef?: (ref: EChartsHandle | null) => void;
}

export default function PlotArea({ onChartRef }: PlotAreaProps) {
  const chartRef = useRef<EChartsHandle>(null);
  const files = useFileStore((s) => s.files);
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const [messageApi, contextHolder] = message.useMessage();

  // 眼图状态
  const [eyeMode, setEyeMode] = useState(false);
  const [bitPeriodValue, setBitPeriodValue] = useState(1); // 数值
  const [bitPeriodUnit, setBitPeriodUnit] = useState(1e-6); // 单位（秒）

  // 计算实际的 bit period（秒）
  const bitPeriod = bitPeriodValue * bitPeriodUnit;

  // 获取当前活跃窗口
  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const selectedWaves = activeWindow?.selectedWaves ?? new Set<string>();

  // 收集所有选中的波形数据
  const series = useMemo(() => {
    const allSeries = Array.from(selectedWaves)
      .map((key) => {
        const [filename, waveName] = key.split('::');
        const file = files.get(filename);
        if (!file) return null;
        const wave = file.waveforms.find((w: { name: string }) => w.name === waveName);
        if (!wave) return null;
        return { ...wave, filename };
      })
      .filter(Boolean) as { name: string; xData: number[]; yData: number[]; unit: { x: string; y: string }; filename: string }[];

    // X 轴单位校验
    if (allSeries.length > 0) {
      const xUnits = new Set(allSeries.map((s) => s.unit.x));
      if (xUnits.size > 1) {
        messageApi.warning('Mixed X-axis units detected, may cause display issues');
      }
    }

    return allSeries;
  }, [selectedWaves, files, messageApi]);

  // 检测是否有 tr0 文件的波形
  const hasTrWaveforms = series.some((s) => s.filename.endsWith('.tr0') || s.filename.endsWith('.tr1'));

  // 当 EChartsWrapper 的 ref 设置时，传递给父组件
  const handleRef = (ref: EChartsHandle | null) => {
    (chartRef as React.MutableRefObject<EChartsHandle | null>).current = ref;
    onChartRef?.(ref);
  };

  // 切换眼图模式
  const toggleEyeMode = () => {
    if (!eyeMode && series.length === 0) {
      messageApi.warning('Please select a waveform first');
      return;
    }
    setEyeMode(!eyeMode);
  };

  // 自动计算位周期
  const handleAutoDetect = useCallback(() => {
    if (series.length === 0) return;
    const detected = autoDetectBitPeriod(series[0].xData, series[0].yData);
    if (detected > 0) {
      // 自动选择合适的单位
      if (detected >= 1) { setBitPeriodValue(detected); setBitPeriodUnit(1); }
      else if (detected >= 1e-3) { setBitPeriodValue(detected * 1e3); setBitPeriodUnit(1e-3); }
      else if (detected >= 1e-6) { setBitPeriodValue(detected * 1e6); setBitPeriodUnit(1e-6); }
      else if (detected >= 1e-9) { setBitPeriodValue(detected * 1e9); setBitPeriodUnit(1e-9); }
      else { setBitPeriodValue(detected * 1e12); setBitPeriodUnit(1e-12); }
      messageApi.success(`Detected bit period: ${detected.toPrecision(4)} s`);
    } else {
      messageApi.warning('Could not detect bit period, please enter manually');
    }
  }, [series, messageApi]);

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {contextHolder}
      {/* 眼图控制栏 */}
      {hasTrWaveforms && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px',
            background: 'var(--bg-toolbar)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Tooltip title={eyeMode ? 'Switch to Waveform' : 'Switch to Eye Diagram'}>
            <Button
              type={eyeMode ? 'primary' : 'default'}
              size="small"
              icon={eyeMode ? <LineChartOutlined /> : <EyeOutlined />}
              onClick={toggleEyeMode}
            />
          </Tooltip>
          {eyeMode && (
            <Space size={4}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bit Period:</span>
              <InputNumber
                value={bitPeriodValue}
                onChange={(v) => v && setBitPeriodValue(v)}
                min={0.01}
                max={1000}
                step={1}
                size="small"
                style={{ width: 80 }}
              />
              <Select
                value={bitPeriodUnit}
                onChange={setBitPeriodUnit}
                options={timeUnitOptions}
                size="small"
                style={{ width: 60 }}
              />
              <Tooltip title="Auto Detect">
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={handleAutoDetect}
                />
              </Tooltip>
            </Space>
          )}
          {eyeMode && series.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Eye Height: {series.length > 0 ? 'Calculating...' : '-'}
            </span>
          )}
        </div>
      )}

      {/* 图表区域 */}
      {series.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          Select waveforms in the file tree to display
        </div>
      ) : eyeMode ? (
        // 眼图模式：显示第一个选中的波形
        <EyeChart
          name={series[0].name}
          xData={series[0].xData}
          yData={series[0].yData}
          bitPeriod={bitPeriod}
          style={{ flex: 1 }}
        />
      ) : (
        // 普通波形模式
        <EChartsWrapper ref={handleRef} series={series} style={{ flex: 1 }} />
      )}
    </div>
  );
}
