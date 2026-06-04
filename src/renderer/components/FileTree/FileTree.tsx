import { useState, useCallback } from 'react';
import { Tree, Dropdown, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
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

  // 关闭菜单
  const handleCloseMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, filename: null });
  }, []);

  // 右键菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'remove',
      label: 'Remove',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleRemoveFile,
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-sidebar)',
        overflow: 'auto',
        padding: '8px 0',
      }}
      onClick={handleCloseMenu}
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
      <Dropdown
        menu={{ items: menuItems }}
        open={contextMenu.visible}
        trigger={[]}
      >
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            width: 0,
            height: 0,
          }}
        />
      </Dropdown>
    </div>
  );
}
