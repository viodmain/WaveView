import { useState, useCallback, useRef, useEffect } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';
import { useFileStore } from './stores/fileStore';
import { parseFile } from './parsers/parserFactory';
import './styles/global.css';

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [messageApi, contextHolder] = message.useMessage();
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const addFile = useFileStore((s) => s.addFile);

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
          messageApi.error(`读取文件失败: ${result.error}`);
          continue;
        }

        try {
          const parsed = parseFile(result.filename!, result.content!);
          addFile(parsed);
          messageApi.success(`已导入: ${result.filename}`);
        } catch (err) {
          messageApi.error(`解析失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      messageApi.error(`操作失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addFile, messageApi]);

  // 键盘快捷键 Ctrl+O
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
        <Workbench onOpenFile={handleOpenFile} />
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
