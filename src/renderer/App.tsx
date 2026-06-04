import { useState, useCallback, useRef, useEffect } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';
import WindowTabs from './components/PlotArea/WindowTabs';
import { useFileStore } from './stores/fileStore';
import { useWindowStore } from './stores/windowStore';
import { parseFile } from './parsers/parserFactory';
import type { EChartsHandle } from './components/PlotArea/EChartsWrapper';
import './styles/global.css';

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [messageApi, contextHolder] = message.useMessage();
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const addFile = useFileStore((s) => s.addFile);
  const createWindow = useWindowStore((s) => s.createWindow);
  const chartRef = useRef<EChartsHandle | null>(null);

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

  const handleOpenFile = useCallback(async () => {
    try {
      const filePaths = await window.electronAPI.openFileDialog();
      if (!filePaths || filePaths.length === 0) return;

      for (const filePath of filePaths) {
        const result = await window.electronAPI.readFile(filePath);
        if (!result.success) {
          messageApi.error(`Failed to read file: ${result.error}`);
          continue;
        }

        try {
          const parsed = parseFile(result.filename!, result.content!);
          addFile(parsed);
          messageApi.success(`Imported: ${result.filename}`);
        } catch (err) {
          messageApi.error(`Parse failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      messageApi.error(`Operation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addFile, messageApi]);

  const handleZoom = useCallback(() => {
    chartRef.current?.startDataZoom();
    messageApi.info('Box zoom enabled, drag on chart to select area');
  }, [messageApi]);

  const handleResetZoom = useCallback(() => {
    chartRef.current?.resetZoom();
    messageApi.info('View reset');
  }, [messageApi]);

  const handleNewWindow = useCallback(() => {
    createWindow();
    messageApi.info('New window created');
  }, [createWindow, messageApi]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O 打开文件
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenFile]);

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
      {contextHolder}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Workbench
          onOpenFile={handleOpenFile}
          onZoom={handleZoom}
          onReset={handleResetZoom}
          onNewWindow={handleNewWindow}
        />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: sidebarWidth, flexShrink: 0, overflow: 'hidden' }}>
            <FileTree />
          </div>
          <div
            className="ResizeHandle"
            onMouseDown={handleMouseDown}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <WindowTabs />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PlotArea onChartRef={(ref) => { chartRef.current = ref; }} />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
