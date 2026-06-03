import { useState, useCallback, useRef } from 'react';
import { ConfigProvider, theme } from 'antd';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';
import './styles/global.css';

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(160, Math.min(500, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#007acc',
          borderRadius: 2,
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Workbench />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: sidebarWidth, flexShrink: 0, overflow: 'hidden' }}>
            <FileTree />
          </div>
          <div
            className="ResizeHandle"
            onMouseDown={handleMouseDown}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PlotArea />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
