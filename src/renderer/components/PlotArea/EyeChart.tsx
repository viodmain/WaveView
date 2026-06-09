import { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useSettingsStore } from '../../stores/settingsStore';
import { generateEyeDiagram, type EyeDiagramData } from '../../utils/eyeDiagram';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface EyeChartProps {
  /** 波形名称 */
  name: string;
  /** X 轴数据（时间） */
  xData: number[];
  /** Y 轴数据（信号） */
  yData: number[];
  /** 位周期（秒） */
  bitPeriod: number;
  style?: React.CSSProperties;
}

/** 获取 CSS 变量值 */
function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function EyeChart({ name, xData, yData, bitPeriod, style }: EyeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const theme = useSettingsStore((s) => s.theme);

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

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (xData.length === 0 || bitPeriod <= 0) {
      chart.clear();
      return;
    }

    const timer = setTimeout(() => {
      // 生成眼图数据
      const eyeData = generateEyeDiagram(xData, yData, bitPeriod);

      // 根据主题获取颜色
      const bgColor = getCssVar('--bg-base') || '#1e1e1e';
      const textColor = getCssVar('--text-primary') || '#cccccc';
      const secondaryColor = getCssVar('--text-secondary') || '#969696';
      const borderColor = getCssVar('--border') || '#333333';

      // 生成颜色渐变（从蓝到红）
      const colors = generateColors(eyeData.traces.length);

      const option: echarts.EChartsCoreOption = {
        backgroundColor: bgColor,
        textStyle: { color: textColor },
        title: {
          text: `Eye Diagram: ${name}`,
          textStyle: { color: textColor, fontSize: 14 },
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (!Array.isArray(params) || params.length === 0) return '';
            const x = params[0]?.value?.[0];
            return `<div>${x.toFixed(3)} UI</div>`;
          },
        },
        legend: {
          show: false,
        },
        grid: {
          left: 60,
          right: 30,
          top: 40,
          bottom: 60,
        },
        xAxis: {
          type: 'value',
          name: 'Time (s)',
          nameTextStyle: { color: secondaryColor },
          axisLabel: {
            color: secondaryColor,
            formatter: (value: number) => {
              if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} ms`;
              if (value >= 1e-6) return `${(value * 1e6).toFixed(2)} us`;
              if (value >= 1e-9) return `${(value * 1e9).toFixed(2)} ns`;
              return `${(value * 1e12).toFixed(2)} ps`;
            },
          },
          splitLine: { lineStyle: { color: borderColor } },
          min: 0,
          max: bitPeriod * 2,
        },
        yAxis: {
          type: 'value',
          name: 'Amplitude',
          nameTextStyle: { color: secondaryColor },
          axisLabel: { color: secondaryColor },
          splitLine: { lineStyle: { color: borderColor } },
        },
        series: eyeData.traces.map((trace, index) => ({
          name: `Trace ${index + 1}`,
          type: 'line' as const,
          showSymbol: false,
          lineStyle: {
            width: 0.5,
            color: colors[index],
            opacity: 0.3,
          },
          data: trace.x.map((x, i) => [x, trace.y[i]]),
          silent: true,
        })),
      };

      chart.setOption(option, true);
    }, 50);

    return () => clearTimeout(timer);
  }, [xData, yData, bitPeriod, name, theme]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}

/**
 * 生成渐变颜色（从蓝到红）
 */
function generateColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const ratio = i / Math.max(count - 1, 1);
    const r = Math.round(50 + ratio * 200);
    const g = Math.round(100 - ratio * 50);
    const b = Math.round(250 - ratio * 200);
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  return colors;
}
