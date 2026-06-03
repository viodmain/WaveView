import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent, ToolboxComponent, CanvasRenderer]);

export interface SeriesData {
  name: string;
  xData: number[];
  yData: number[];
  unit: { x: string; y: string };
}

export interface EChartsHandle {
  resetZoom: () => void;
  startDataZoom: () => void;
}

interface EChartsWrapperProps {
  series: SeriesData[];
  style?: React.CSSProperties;
}

const EChartsWrapper = forwardRef<EChartsHandle, EChartsWrapperProps>(({ series, style }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      const chart = chartRef.current;
      if (!chart) return;
      chart.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100,
      });
    },
    startDataZoom: () => {
      const chart = chartRef.current;
      if (!chart) return;
      // 触发 toolbox 的 dataZoom 选框模式
      chart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true,
      });
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current, 'dark');
    chartRef.current = chart;

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (series.length === 0) {
      chart.clear();
      return;
    }

    const xUnit = series[0]?.unit.x ?? '';
    const yUnit = series[0]?.unit.y ?? '';

    const option: echarts.EChartsCoreOption = {
      backgroundColor: '#1e1e1e',
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        top: 8,
        textStyle: { color: '#ccc' },
      },
      toolbox: {
        show: false,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
        },
      },
      grid: {
        left: 60,
        right: 30,
        top: 40,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        name: xUnit,
        nameTextStyle: { color: '#999' },
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#333' } },
      },
      yAxis: {
        type: 'value',
        name: yUnit,
        nameTextStyle: { color: '#999' },
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#333' } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
      ],
      series: series.map((s) => ({
        name: s.name,
        type: 'line' as const,
        showSymbol: false,
        lineStyle: { width: 1.5 },
        data: s.xData.map((x, i) => [x, s.yData[i]]),
      })),
    };

    chart.setOption(option, true);
  }, [series]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
});

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
