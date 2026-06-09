import { useRef, useMemo, useState } from 'react';
import { message, Button, InputNumber, Space, Tooltip } from 'antd';
import { EyeOutlined, LineChartOutlined } from '@ant-design/icons';
import EChartsWrapper, { type EChartsHandle } from './EChartsWrapper';
import EyeChart from './EyeChart';
import { useFileStore } from '../../stores/fileStore';
import { useWindowStore } from '../../stores/windowStore';

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
  const [bitPeriod, setBitPeriod] = useState(1e-6); // 默认 1us

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
                value={bitPeriod}
                onChange={(v) => v && setBitPeriod(v)}
                min={1e-12}
                max={1}
                step={1e-6}
                size="small"
                style={{ width: 120 }}
                formatter={(value) => {
                  if (!value) return '';
                  if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} ms`;
                  if (value >= 1e-6) return `${(value * 1e6).toFixed(2)} us`;
                  if (value >= 1e-9) return `${(value * 1e9).toFixed(2)} ns`;
                  return `${(value * 1e12).toFixed(2)} ps`;
                }}
                parser={(text) => {
                  if (!text) return 1e-6;
                  const num = parseFloat(text);
                  if (text.includes('ms')) return num * 1e-3;
                  if (text.includes('us')) return num * 1e-6;
                  if (text.includes('ns')) return num * 1e-9;
                  if (text.includes('ps')) return num * 1e-12;
                  return num;
                }}
              />
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
