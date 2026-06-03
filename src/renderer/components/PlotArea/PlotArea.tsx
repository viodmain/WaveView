import { useRef, useMemo } from 'react';
import { message } from 'antd';
import EChartsWrapper, { type EChartsHandle } from './EChartsWrapper';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';

interface PlotAreaProps {
  onChartRef?: (ref: EChartsHandle | null) => void;
}

export default function PlotArea({ onChartRef }: PlotAreaProps) {
  const chartRef = useRef<EChartsHandle>(null);
  const files = useFileStore((s) => s.files);
  const selectedWaves = useWaveStore((s) => s.selectedWaves);
  const [messageApi, contextHolder] = message.useMessage();

  // 收集所有选中的波形数据
  const series = useMemo(() => {
    const allSeries = Array.from(selectedWaves)
      .map((key) => {
        const [filename, waveName] = key.split('::');
        const file = files.get(filename);
        if (!file) return null;
        const wave = file.waveforms.find((w: { name: string }) => w.name === waveName);
        if (!wave) return null;
        return wave;
      })
      .filter(Boolean) as { name: string; xData: number[]; yData: number[]; unit: { x: string; y: string } }[];

    // X 轴单位校验：检查是否有不同单位的波形混搭
    if (allSeries.length > 0) {
      const xUnits = new Set(allSeries.map((s) => s.unit.x));
      if (xUnits.size > 1) {
        messageApi.warning('检测到不同 X 轴单位的波形混搭，可能导致显示异常');
      }
    }

    return allSeries;
  }, [selectedWaves, files, messageApi]);

  // 当 EChartsWrapper 的 ref 设置时，传递给父组件
  const handleRef = (ref: EChartsHandle | null) => {
    (chartRef as React.MutableRefObject<EChartsHandle | null>).current = ref;
    onChartRef?.(ref);
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
          在左侧目录树中勾选波形以显示
        </div>
      ) : (
        <EChartsWrapper ref={handleRef} series={series} style={{ flex: 1 }} />
      )}
    </div>
  );
}
