import React, { useState } from 'react';
import { Space, Button, Tooltip, Modal, Switch, Slider, message } from 'antd';
import {
  FolderOpenOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../../stores/fileStore';
import { useWaveStore } from '../../stores/waveStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { parseFile } from '../../parsers/parserFactory';

const Workbench: React.FC = () => {
  const { addFile } = useFileStore();
  const { addWindow, syncEnabled, setSyncEnabled } = useWaveStore();
  const { theme, fontSize, zoomMode, setTheme, setFontSize, setZoomMode, triggerReset } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenFile = async () => {
    try {
      const result = await window.electronAPI.openFile();
      if (result) {
        let hasError = false;
        result.forEach((file: { name: string; content: string }) => {
          const parsed = parseFile(file.name, file.content);
          if (parsed) {
            addFile(parsed);
            if (parsed.metadata?.error) {
              hasError = true;
            }
          } else {
            hasError = true;
          }
        });

        // Auto-create a window if none exists (use getState to avoid stale closure)
        const { windows } = useWaveStore.getState();
        if (windows.length === 0) {
          addWindow();
        }

        if (hasError) {
          message.warning('Some files could not be parsed correctly.');
        } else {
          message.success(`Loaded ${result.length} file(s).`);
        }
      }
    } catch (err) {
      message.error(`Failed to open file: ${err}`);
    }
  };

  return (
    <div className="workbench">
      <Space>
        <Tooltip title="Open File">
          <Button icon={<FolderOpenOutlined />} onClick={handleOpenFile}>
            Open
          </Button>
        </Tooltip>
        <Tooltip title={zoomMode ? 'Switch to Pan Mode' : 'Switch to Zoom Mode'}>
          <Button
            icon={<SearchOutlined />}
            type={zoomMode ? 'primary' : 'default'}
            onClick={() => setZoomMode(!zoomMode)}
          >
            {zoomMode ? 'Zoom' : 'Pan'}
          </Button>
        </Tooltip>
        <Tooltip title="Reset View">
          <Button icon={<ReloadOutlined />} onClick={triggerReset}>
            Reset
          </Button>
        </Tooltip>
        <Tooltip title="New Window">
          <Button icon={<PlusOutlined />} onClick={addWindow}>
            New Window
          </Button>
        </Tooltip>
        <Tooltip title="Settings">
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </Tooltip>
      </Space>

      <Modal
        title="Settings"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Dark Theme</span>
            <Switch
              checked={theme === 'dark'}
              onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <div>
            <span>Font Size: {fontSize}px</span>
            <Slider
              min={10}
              max={20}
              value={fontSize}
              onChange={setFontSize}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>X-Axis Sync Across Windows</span>
            <Switch
              checked={syncEnabled}
              onChange={setSyncEnabled}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Workbench;
