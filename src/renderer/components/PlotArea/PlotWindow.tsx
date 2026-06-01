import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useWaveStore } from '../../stores/waveStore';
import { useFileStore } from '../../stores/fileStore';

interface PlotWindowProps {
  windowId: string;
}

const PlotWindow: React.FC<PlotWindowProps> = ({ windowId }) => {
  const { windows } = useWaveStore();
  const { files } = useFileStore();

  const window = windows.find((w) => w.id === windowId);

  const traces = useMemo(() => {
    if (!window) return [];

    return window.waves
      .map(({ filename, waveName }) => {
        const file = files.get(filename);
        if (!file) return null;

        const wave = file.waveforms.find((w) => w.name === waveName);
        if (!wave) return null;

        return {
          x: wave.xData,
          y: wave.yData,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: `${filename}:${waveName}`,
        };
      })
      .filter(Boolean);
  }, [window, files]);

  if (!window) return null;

  if (traces.length === 0) {
    return (
      <div className="plot-window-empty">
        <p>Select waveforms from the file tree to plot.</p>
      </div>
    );
  }

  return (
    <Plot
      data={traces}
      layout={{
        autosize: true,
        margin: { t: 30, r: 30, b: 50, l: 60 },
        xaxis: {
          title: 'Time (s)',
          showgrid: true,
        },
        yaxis: {
          title: 'Value',
          showgrid: true,
        },
        legend: {
          orientation: 'h',
          yanchor: 'bottom',
          y: 1.02,
          xanchor: 'right',
          x: 1,
        },
      }}
      config={{
        responsive: true,
        scrollZoom: true,
      }}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default PlotWindow;
