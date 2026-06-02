import React, { useCallback } from 'react';
import { Tree, Tag, message } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';

// Use a separator that won't appear in filenames
const SEPARATOR = '\0';

// Map x-axis unit keys to display labels
const X_UNIT_LABELS: Record<string, string> = {
  s: 'Time(s)',
  Hz: 'Freq(Hz)',
  hz: 'Freq(Hz)',
  khz: 'Freq(kHz)',
  mhz: 'Freq(MHz)',
  ghz: 'Freq(GHz)',
};

const FileTree: React.FC = () => {
  const { files } = useFileStore();
  const { windows, activeWindowId, toggleWave } = useWaveStore();

  const activeWindow = windows.find((w) => w.id === activeWindowId);

  // Get the x-unit of the current window (from the first waveform)
  const windowXUnit = React.useMemo(() => {
    if (!activeWindow || activeWindow.waves.length === 0) return null;
    const firstWave = activeWindow.waves[0];
    const file = files.get(firstWave.filename);
    if (!file) return null;
    const wave = file.waveforms.find((w) => w.name === firstWave.waveName);
    return wave?.unit.x || null;
  }, [activeWindow, files]);

  // Build tree data with x-unit info displayed
  const treeData: DataNode[] = Array.from(files.entries()).map(([filename, file]) => {
    // Get unique x-units in this file
    const xUnitSet = new Set(file.waveforms.map((w) => w.unit.x));
    const xUnitLabel = Array.from(xUnitSet)
      .map((u) => X_UNIT_LABELS[u] || u)
      .join('/');

    return {
      title: (
        <span>
          {filename}
          <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
            {xUnitLabel}
          </Tag>
        </span>
      ),
      key: filename,
      children: file.waveforms.map((wave) => ({
        title: wave.name,
        key: `${filename}${SEPARATOR}${wave.name}`,
        isLeaf: true,
      })),
    };
  });

  const checkedKeys = activeWindow
    ? activeWindow.waves.map((w) => `${w.filename}${SEPARATOR}${w.waveName}`)
    : [];

  const onCheck: TreeProps['onCheck'] = useCallback(
    (checked: any, info: any) => {
      if (!activeWindowId) {
        message.warning('Please create or select a plot window first.');
        return;
      }

      const key = info.node.key as string;
      const separatorIdx = key.indexOf(SEPARATOR);
      if (separatorIdx === -1) return; // Clicked on parent node, ignore

      const filename = key.substring(0, separatorIdx);
      const waveName = key.substring(separatorIdx + 1);

      // Look up the waveform's x-unit
      const file = files.get(filename);
      if (!file) return;
      const wave = file.waveforms.find((w) => w.name === waveName);
      if (!wave) return;

      // Check x-unit compatibility with existing waves in the window
      if (windowXUnit && wave.unit.x !== windowXUnit) {
        const currentLabel = X_UNIT_LABELS[windowXUnit] || windowXUnit;
        const newLabel = X_UNIT_LABELS[wave.unit.x] || wave.unit.x;
        message.error(
          `Cannot add "${waveName}": X-axis unit mismatch. Current window uses ${currentLabel}, but this curve uses ${newLabel}.`
        );
        return;
      }

      toggleWave(activeWindowId, filename, waveName);
    },
    [activeWindowId, windowXUnit, files, toggleWave]
  );

  return (
    <div className="file-tree">
      <div className="file-tree-header">Files</div>
      {treeData.length === 0 ? (
        <div className="file-tree-empty">No files loaded. Click &quot;Open&quot; to import files.</div>
      ) : (
        <Tree
          checkable
          treeData={treeData}
          checkedKeys={checkedKeys}
          onCheck={onCheck}
          defaultExpandAll
        />
      )}
    </div>
  );
};

export default FileTree;
