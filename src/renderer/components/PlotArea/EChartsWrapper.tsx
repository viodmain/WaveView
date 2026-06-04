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
import { useSettingsStore } from '../../stores/settingsStore';

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

/** 获取 CSS 变量值 */
function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const EChartsWrapper = forwardRef<EChartsHandle, EChartsWrapperProps>(({ series, style }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const theme = useSettingsStore((s) => s.theme);

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
    const chart = echarts.init(containerRef.current);
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

    // 根据主题获取颜色
    const bgColor = getCssVar('--bg-base') || '#1e1e1e';
    const textColor = getCssVar('--text-primary') || '#cccccc';
    const secondaryColor = getCssVar('--text-secondary') || '#969696';
    const borderColor = getCssVar('--border') || '#333333';

    const xUnit = series[0]?.unit.x ?? '';
    const yUnit = series[0]?.unit.y ?? '';

    const option: echarts.EChartsCoreOption = {
      backgroundColor: bgColor,
      textStyle: { color: textColor },
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
        textStyle: { color: secondaryColor },
      },
      toolbox: {
        show: true,
        right: 20,
        top: 8,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: {
              zoom: 'Box Zoom',
              back: 'Restore',
            },
          },
          restore: {
            title: 'Restore',
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
        nameTextStyle: { color: secondaryColor },
        axisLabel: {
          color: secondaryColor,
          formatter: (value: number) => scientificNotation(value),
        },
        splitLine: { lineStyle: { color: borderColor } },
      },
      yAxis: {
        type: 'value',
        name: yUnit,
        nameTextStyle: { color: secondaryColor },
        axisLabel: {
          color: secondaryColor,
          formatter: (value: number) => scientificNotation(value),
        },
        splitLine: { lineStyle: { color: borderColor } },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomOnMouseWheel: 'ctrl',
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,
          filterMode: 'none',
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          zoomOnMouseWheel: 'shift',
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,
          filterMode: 'none',
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
  }, [series, isZoomMode, theme]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
});

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
