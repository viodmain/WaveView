import React, { useEffect, useRef, memo } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotWrapperProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  onRelayout?: (event: any) => void;
  useResizeHandler?: boolean;
  style?: React.CSSProperties;
  resetCounter?: number;
  resetUpdate?: Record<string, any>;
}

const PlotWrapper: React.FC<PlotWrapperProps> = memo(({
  data,
  layout = {},
  config = {},
  onRelayout,
  useResizeHandler = false,
  style,
  resetCounter = 0,
  resetUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlot = useRef(false);

  // Create or update plot
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      if (!containerRef.current) return;

      if (hasPlot.current) {
        await Plotly.react(containerRef.current, data, layout, config);
      } else {
        await Plotly.newPlot(containerRef.current, data, layout, config);
        hasPlot.current = true;
      }

      // Attach relayout listener
      if (onRelayout && containerRef.current) {
        const el = containerRef.current as any;
        el.removeAllListeners?.('plotly_relayout');
        el.on('plotly_relayout', onRelayout);
      }
    };

    init();
  }, [data, layout, config, onRelayout]);

  // Handle reset
  useEffect(() => {
    if (resetCounter > 0 && containerRef.current && hasPlot.current && resetUpdate) {
      Plotly.relayout(containerRef.current, resetUpdate);
    }
  }, [resetCounter, resetUpdate]);

  // Handle resize
  useEffect(() => {
    if (!useResizeHandler || !containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (containerRef.current && hasPlot.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [useResizeHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current && hasPlot.current) {
        Plotly.purge(containerRef.current);
        hasPlot.current = false;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={style}
    />
  );
});

PlotWrapper.displayName = 'PlotWrapper';

export default PlotWrapper;
