import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileTextOutlined, LineChartOutlined } from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';

export default function FileTree() {
  const files = useFileStore((s) => s.files);
  const { selectedWaves, toggleWave } = useWaveStore();

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

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-sidebar)',
        overflow: 'auto',
        padding: '8px 0',
      }}
    >
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
        onCheck={(keys) => {
          const newKeys = new Set(keys as string[]);
          // 找出变化的 key
          for (const k of newKeys) {
            if (!selectedWaves.has(k)) toggleWave(k);
          }
          for (const k of selectedWaves) {
            if (!newKeys.has(k)) toggleWave(k);
          }
        }}
        style={{ background: 'transparent', color: 'var(--text-primary)' }}
      />
    </div>
  );
}
