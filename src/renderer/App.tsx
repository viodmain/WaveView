import { useState, useCallback, useRef, useEffect } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';
import WindowTabs from './components/PlotArea/WindowTabs';
import SettingsPanel from './components/Settings/SettingsPanel';
import { useFileStore } from './stores/fileStore';
import { useWindowStore } from './stores/windowStore';
import { useSettingsStore } from './stores/settingsStore';
import type { EChartsHandle } from './components/PlotArea/EChartsWrapper';
import './styles/global.css';

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const addFile = useFileStore((s) => s.addFile);
  const createWindow = useWindowStore((s) => s.createWindow);
  const chartRef = useRef<EChartsHandle | null>(null);
  const settingsStore = useSettingsStore();

  // 根据主题切换 CSS 类名
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${settingsStore.theme}`);
  }, [settingsStore.theme]);

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

  // 使用 Worker 解析文件
  const parseFileWithWorker = useCallback((filename: string, content: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('./workers/parseWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const { success, result, error } = e.data;
        worker.terminate();
        if (success) resolve(result);
        else reject(new Error(error));
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(err.message));
      };

      worker.postMessage({ filename, content });
    });
  }, []);

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
          const parsed = await parseFileWithWorker(result.filename!, result.content!);
          addFile(parsed);
          messageApi.success(`Imported: ${result.filename}`);
        } catch (err) {
          messageApi.error(`Parse failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      messageApi.error(`Operation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addFile, messageApi, parseFileWithWorker]);

  // Pan 模式切换
  const handlePan = useCallback(() => {
    const newPanMode = !isPanMode;
    setIsPanMode(newPanMode);
    chartRef.current?.setPanMode(newPanMode);
    messageApi.info(newPanMode ? 'Pan mode enabled, drag to move' : 'Pan mode disabled');
  }, [isPanMode, messageApi]);

  // Reset：退出 Pan 模式 + 重置缩放
  const handleReset = useCallback(() => {
    setIsPanMode(false);
    chartRef.current?.setPanMode(false);
    chartRef.current?.resetZoom();
    messageApi.info('View reset');
  }, [messageApi]);

  const handleNewWindow = useCallback(() => {
    createWindow();
    messageApi.info('New window created');
  }, [createWindow, messageApi]);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenFile]);

  const themeAlgorithm = settingsStore.theme === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm;

  return (
    <ConfigProvider
      theme={{
        algorithm: themeAlgorithm,
        token: {
          colorPrimary: '#007acc',
          borderRadius: 2,
          fontSize: settingsStore.fontSize,
        },
      }}
    >
      {contextHolder}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Workbench
          onOpenFile={handleOpenFile}
          onPan={handlePan}
          onReset={handleReset}
          onNewWindow={handleNewWindow}
          onOpenSettings={handleOpenSettings}
          isPanMode={isPanMode}
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
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ConfigProvider>
  );
}
