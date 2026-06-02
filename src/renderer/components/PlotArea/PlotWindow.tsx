import React, { useMemo, useCallback, useRef } from 'react';
import PlotWrapper from './PlotWrapper';
import { useWaveStore } from '../../stores/waveStore';
import { useFileStore } from '../../stores/fileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { downsampleIfNeeded } from '../../utils/downsample';
import { WaveformData } from '../../../shared/types';

interface PlotWindowProps {
  windowId: string;
}

const Y_UNIT_LABELS: Record<string, string> = {
  V: 'Voltage (V)',
  A: 'Current (A)',
  deg: 'Phase (deg)',
  mag: 'Magnitude',
  dB: 'Magnitude (dB)',
  W: 'Power (W)',
};

const X_UNIT_LABELS: Record<string, string> = {
  s: 'Time (s)',
  Hz: 'Frequency (Hz)',
  hz: 'Frequency (Hz)',
  khz: 'Frequency (kHz)',
  mhz: 'Frequency (MHz)',
  ghz: 'Frequency (GHz)',
};

const PlotWindow: React.FC<PlotWindowProps> = ({ windowId }) => {
  const { windows, sharedXRange, syncEnabled, updateSharedXRange } = useWaveStore();
  const { files } = useFileStore();
  const { zoomMode, resetCounter } = useSettingsStore();

  const window = windows.find((w) => w.id === windowId);

  // Resolve waveform data and detect y-unit groups
  const { traces, axisLabels, useRightAxis } = useMemo(() => {
    if (!window || window.waves.length === 0) {
      return { traces: [], axisLabels: { x: 'X', y: 'Y' }, useRightAxis: false };
    }

    // Resolve all waves with their metadata
    const resolvedWaves: Array<{ filename: string; waveName: string; wave: WaveformData }> = [];
    for (const { filename, waveName } of window.waves) {
      const file = files.get(filename);
      if (!file) continue;
      const wave = file.waveforms.find((w) => w.name === waveName);
      if (!wave) continue;
      resolvedWaves.push({ filename, waveName, wave });
    }

    if (resolvedWaves.length === 0) {
      return { traces: [], axisLabels: { x: 'X', y: 'Y' }, useRightAxis: false };
    }

    // Detect unique y-units
    const yUnits = new Set(resolvedWaves.map((w) => w.wave.unit.y));
    const hasDualYAxis = yUnits.size > 1;

    // First y-unit goes to left axis, second goes to right axis
    const yUnitArray = Array.from(yUnits);
    const leftYUnit = yUnitArray[0];
    const rightYUnit = yUnitArray[1] || null;

    // Build Plotly traces with downsampling for large datasets
    const traces = resolvedWaves.map(({ filename, waveName, wave }) => {
      const isRightAxis = hasDualYAxis && wave.unit.y === rightYUnit;
      const { xData, yData } = downsampleIfNeeded(wave.xData, wave.yData);
      return {
        x: xData,
        y: yData,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `${filename}:${waveName}`,
        yaxis: isRightAxis ? 'y2' : 'y',
      };
    });

    // X-axis label from first wave
    const xLabel = X_UNIT_LABELS[resolvedWaves[0].wave.unit.x] || resolvedWaves[0].wave.unit.x;

    return {
      traces,
      axisLabels: {
        x: xLabel,
        y: Y_UNIT_LABELS[leftYUnit] || leftYUnit,
        y2: rightYUnit ? Y_UNIT_LABELS[rightYUnit] || rightYUnit : undefined,
      },
      useRightAxis: hasDualYAxis,
    };
  }, [window, files]);

  // Handle user zoom/pan - update shared range
  const handleRelayout = useCallback(
    (event: any) => {
      if (!syncEnabled) return;
      const xMin = event['xaxis.range[0]'] ?? event['xaxis.range']?.[0];
      const xMax = event['xaxis.range[1]'] ?? event['xaxis.range']?.[1];
      if (xMin !== undefined && xMax !== undefined) {
        updateSharedXRange({ min: xMin, max: xMax });
      } else if (event['xaxis.autorange']) {
        updateSharedXRange(null);
      }
    },
    [syncEnabled, updateSharedXRange]
  );

  // Apply shared range to layout when it changes from another window
  const appliedXRange = useMemo(() => {
    if (!syncEnabled || !sharedXRange) return undefined;
    return [sharedXRange.min, sharedXRange.max];
  }, [syncEnabled, sharedXRange]);

  if (!window) return null;

  if (traces.length === 0) {
    return (
      <div className="plot-window-empty">
        <p>Select waveforms from the file tree to plot.</p>
      </div>
    );
  }

  const layout: Record<string, any> = {
    autosize: true,
    dragmode: zoomMode ? 'zoom' : 'pan',
    margin: { t: 30, r: useRightAxis ? 60 : 30, b: 50, l: 60 },
    xaxis: {
      title: axisLabels.x,
      showgrid: true,
      range: appliedXRange,
      autorange: appliedXRange ? false : true,
    },
    yaxis: {
      title: axisLabels.y,
      showgrid: true,
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
    },
  };

  // Add right Y-axis if needed
  if (useRightAxis && axisLabels.y2) {
    layout.yaxis2 = {
      title: axisLabels.y2,
      overlaying: 'y',
      side: 'right',
      showgrid: false,
    };
  }

  return (
    <PlotWrapper
      data={traces}
      layout={layout}
      config={{
        responsive: true,
        scrollZoom: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      }}
      onRelayout={handleRelayout}
      useResizeHandler
      resetCounter={resetCounter}
      resetUpdate={{
        'xaxis.autorange': true,
        'yaxis.autorange': true,
        ...(useRightAxis ? { 'yaxis2.autorange': true } : {}),
      }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default PlotWindow;
