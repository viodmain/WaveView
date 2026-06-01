import React from 'react';
import { Tree } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';

const FileTree: React.FC = () => {
  const { files } = useFileStore();
  const { windows, activeWindowId, toggleWave } = useWaveStore();

  const activeWindow = windows.find((w) => w.id === activeWindowId);

  const treeData: DataNode[] = Array.from(files.entries()).map(([filename, file]) => ({
    title: filename,
    key: filename,
    children: file.waveforms.map((wave) => ({
      title: wave.name,
      key: `${filename}:${wave.name}`,
      isLeaf: true,
    })),
  }));

  const checkedKeys = activeWindow
    ? activeWindow.waves.map((w) => `${w.filename}:${w.waveName}`)
    : [];

  const onCheck: TreeProps['onCheck'] = (checked, info) => {
    if (!activeWindowId) return;
    const key = info.node.key as string;
    const [filename, waveName] = key.split(':');
    toggleWave(activeWindowId, filename, waveName);
  };

  return (
    <div className="file-tree">
      <div className="file-tree-header">Files</div>
      <Tree
        checkable
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={onCheck}
        defaultExpandAll
      />
    </div>
  );
};

export default FileTree;
