import React from 'react';
import { Tabs } from 'antd';
import { useWaveStore } from '../../stores/waveStore';
import PlotWindow from './PlotWindow';

const PlotArea: React.FC = () => {
  const { windows, activeWindowId, setActiveWindow, removeWindow } = useWaveStore();

  if (windows.length === 0) {
    return (
      <div className="plot-area-empty">
        <p>No plot windows. Click "New Window" to create one.</p>
      </div>
    );
  }

  const items = windows.map((w) => ({
    key: w.id,
    label: w.title,
    children: <PlotWindow windowId={w.id} />,
    closable: windows.length > 1,
  }));

  return (
    <div className="plot-area">
      <Tabs
        type="editable-card"
        activeKey={activeWindowId ?? undefined}
        onChange={setActiveWindow}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            removeWindow(String(targetKey));
          }
        }}
        items={items}
      />
    </div>
  );
};

export default PlotArea;
