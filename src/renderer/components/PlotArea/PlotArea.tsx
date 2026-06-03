import EChartsWrapper from './EChartsWrapper';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';

export default function PlotArea() {
  const files = useFileStore((s) => s.files);
  const selectedWaves = useWaveStore((s) => s.selectedWaves);

  // 收集所有选中的波形数据
  const series = Array.from(selectedWaves)
    .map((key) => {
      const [filename, waveName] = key.split('::');
      const file = files.get(filename);
      if (!file) return null;
      const wave = file.waveforms.find((w: { name: string }) => w.name === waveName);
      if (!wave) return null;
      return wave;
    })
    .filter(Boolean) as { name: string; xData: number[]; yData: number[]; unit: { x: string; y: string } }[];

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        <EChartsWrapper series={series} style={{ flex: 1 }} />
      )}
    </div>
  );
}
