import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
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

/** 科学计数法格式化 */
function scientificNotation(value: number): string {
  if (value === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  if (Math.abs(exp) < 3) return value.toPrecision(4);
  return `${mantissa.toFixed(2)}e${exp}`;
}

const EChartsWrapper = forwardRef<EChartsHandle, EChartsWrapperProps>(({ series, style }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      const chart = chartRef.current;
      if (!chart) return;
      chart.dispatchAction({
        type: 'restore',
      });
      setIsZoomMode(false);
    },
    startDataZoom: () => {
      const chart = chartRef.current;
      if (!chart) return;
      setIsZoomMode(true);
      chart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true,
      });
    },
  }));

  // 初始化图表
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

  // 更新图表配置
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
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const x = params[0]?.value?.[0];
          let html = `<div style="font-weight:bold">${scientificNotation(x)} ${xUnit}</div>`;
          for (const p of params) {
            html += `<div>${p.marker} ${p.seriesName}: ${scientificNotation(p.value?.[1])} ${yUnit}</div>`;
          }
          return html;
        },
      },
      legend: {
        top: 8,
        textStyle: { color: '#ccc' },
      },
      toolbox: {
        show: true,
        right: 20,
        top: 8,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: {
              zoom: '框选放大',
              back: '还原',
            },
          },
          restore: {
            title: '还原',
          },
        },
      },
      grid: {
        left: 80,
        right: 30,
        top: 40,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        name: xUnit,
        nameTextStyle: { color: '#999' },
        axisLabel: {
          color: '#999',
          formatter: (value: number) => scientificNotation(value),
        },
        splitLine: { lineStyle: { color: '#333' } },
      },
      yAxis: {
        type: 'value',
        name: yUnit,
        nameTextStyle: { color: '#999' },
        axisLabel: {
          color: '#999',
          formatter: (value: number) => scientificNotation(value),
        },
        splitLine: { lineStyle: { color: '#333' } },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomOnMouseWheel: 'ctrl',    // Ctrl + 滚轮：只缩放 X 轴
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,
          filterMode: 'none',          // 不过滤数据点，保留完整波形
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          zoomOnMouseWheel: 'shift',   // Shift + 滚轮：只缩放 Y 轴
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,
          filterMode: 'none',          // 不过滤数据点，保留完整波形
        },
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

    // 如果是框选模式，重新激活
    if (isZoomMode) {
      chart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true,
      });
    }
  }, [series, isZoomMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
});

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
