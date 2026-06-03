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

/** 科学计数法格式化 */
function scientificNotation(value: number): string {
  if (value === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  // 如果指数较小，直接显示数字
  if (Math.abs(exp) < 3) return value.toPrecision(4);
  return `${mantissa.toFixed(2)}e${exp}`;
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
        dataZoomIndex: 0,
        start: 0,
        end: 100,
      });
      chart.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 1,
        start: 0,
        end: 100,
      });
    },
    startDataZoom: () => {
      const chart = chartRef.current;
      if (!chart) return;
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

  // 监听鼠标滚轮事件，实现 Ctrl/Shift 单独缩放
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const chart = chartRef.current;
      if (!chart) return;

      const chartWidth = container.clientWidth;
      const chartHeight = container.clientHeight;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / chartWidth) * 100;
      const mouseY = ((e.clientY - rect.top) / chartHeight) * 100;

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

      if (e.ctrlKey) {
        // Ctrl + 滚轮：只缩放 X 轴
        e.preventDefault();
        const option = chart.getOption() as any;
        const xZoom = option.dataZoom?.[0];
        if (xZoom) {
          const start = xZoom.start ?? 0;
          const end = xZoom.end ?? 100;
          const range = end - start;
          const newRange = range * zoomFactor;
          const center = start + (range * mouseX) / 100;
          const newStart = Math.max(0, center - (newRange * mouseX) / 100);
          const newEnd = Math.min(100, newStart + newRange);
          chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 0,
            start: newStart,
            end: newEnd,
          });
        }
      } else if (e.shiftKey) {
        // Shift + 滚轮：只缩放 Y 轴
        e.preventDefault();
        const option = chart.getOption() as any;
        const yZoom = option.dataZoom?.[1];
        if (yZoom) {
          const start = yZoom.start ?? 0;
          const end = yZoom.end ?? 100;
          const range = end - start;
          const newRange = range * zoomFactor;
          const center = start + (range * (100 - mouseY)) / 100;
          const newStart = Math.max(0, center - (newRange * (100 - mouseY)) / 100);
          const newEnd = Math.min(100, newStart + newRange);
          chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 1,
            start: newStart,
            end: newEnd,
          });
        }
      }
      // 普通滚轮缩放由 ECharts 内置的 inside dataZoom 处理
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
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
        show: false,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
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
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
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
