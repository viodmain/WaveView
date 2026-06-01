import React from 'react';
import { Space, Button, Tooltip, Dropdown } from 'antd';
import {
  FolderOpenOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';
import { parseFile } from '../../parsers/parserFactory';

const Workbench: React.FC = () => {
  const { addFile } = useFileStore();
  const { addWindow } = useWaveStore();

  const handleOpenFile = async () => {
    const result = await window.electronAPI.openFile();
    if (result) {
      result.forEach((file: { name: string; content: string }) => {
        const parsed = parseFile(file.name, file.content);
        if (parsed) {
          addFile(parsed);
        }
      });
    }
  };

  return (
    <div className="workbench">
      <Space>
        <Tooltip title="Open File">
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleOpenFile}
          >
            Open
          </Button>
        </Tooltip>
        <Tooltip title="Zoom Area">
          <Button icon={<SearchOutlined />} disabled>
            Zoom
          </Button>
        </Tooltip>
        <Tooltip title="Reset View">
          <Button icon={<ReloadOutlined />} disabled>
            Reset
          </Button>
        </Tooltip>
        <Tooltip title="New Window">
          <Button icon={<PlusOutlined />} onClick={addWindow}>
            New Window
          </Button>
        </Tooltip>
        <Tooltip title="Settings">
          <Button icon={<SettingOutlined />} disabled>
            Settings
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default Workbench;
