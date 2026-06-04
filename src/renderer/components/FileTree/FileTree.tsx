import { useState, useCallback, useEffect, useRef } from 'react';
import { Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileTextOutlined, LineChartOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useWindowStore } from '../../stores/windowStore';

export default function FileTree() {
  const files = useFileStore((s) => s.files);
  const removeFile = useFileStore((s) => s.removeFile);
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const toggleWave = useWindowStore((s) => s.toggleWave);
  const [messageApi, contextHolder] = message.useMessage();
  const menuRef = useRef<HTMLDivElement>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    filename: string | null;
  }>({ visible: false, x: 0, y: 0, filename: null });

  // 获取当前活跃窗口
  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const selectedWaves = activeWindow?.selectedWaves ?? new Set<string>();

  const treeData: DataNode[] = Array.from(files.values()).map((file) => ({
    key: file.filename,
    title: file.filename,
    icon: <FileTextOutlined />,
    selectable: false,
    children: file.waveforms.map((w: { name: string }) => {
      const waveKey = `${file.filename}::${w.name}`;
      return {
        key: waveKey,
        title: w.name,
        icon: <LineChartOutlined />,
        isLeaf: true,
      };
    }),
  }));

  const checkedKeys = Array.from(selectedWaves);

  const handleCheck = (keys: any) => {
    if (!activeWindowId) return;
    const newKeys = new Set(keys as string[]);
    for (const k of newKeys) {
      if (!selectedWaves.has(k)) toggleWave(activeWindowId, k);
    }
    for (const k of selectedWaves) {
      if (!newKeys.has(k)) toggleWave(activeWindowId, k);
    }
  };

  // 右键点击文件节点
  const handleRightClick = useCallback((info: any) => {
    const { node, event } = info;
    // 只对文件节点（非叶子节点）响应右键
    if (!node.isLeaf) {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        filename: node.key,
      });
    }
  }, []);

  // 移除文件
  const handleRemoveFile = useCallback(() => {
    if (contextMenu.filename) {
      removeFile(contextMenu.filename);
      messageApi.success(`Removed: ${contextMenu.filename}`);
    }
    setContextMenu({ visible: false, x: 0, y: 0, filename: null });
  }, [contextMenu.filename, removeFile, messageApi]);

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, filename: null });
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.visible]);

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-sidebar)',
        overflow: 'auto',
        padding: '8px 0',
        position: 'relative',
      }}
    >
      {contextHolder}
      <div
        style={{
          padding: '0 12px 8px',
          color: 'var(--text-secondary)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Explorer
      </div>
      <Tree
        showIcon
        checkable
        defaultExpandAll
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={handleCheck}
        onRightClick={handleRightClick}
        style={{ background: 'transparent', color: 'var(--text-primary)' }}
      />
      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-toolbar)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '4px 0',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            minWidth: 120,
          }}
        >
          <div
            onClick={handleRemoveFile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              color: '#ff4d4f',
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <DeleteOutlined />
            Remove
          </div>
        </div>
      )}
    </div>
  );
}
