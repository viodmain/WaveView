import { Button, Tooltip, message, Space } from 'antd';
import {
  FolderOpenOutlined,
  DragOutlined,
  CompressOutlined,
  PlusSquareOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface WorkbenchProps {
  onOpenFile?: () => void;
  onReset?: () => void;
}

export default function Workbench({ onOpenFile, onReset }: WorkbenchProps) {
  const [messageApi, contextHolder] = message.useMessage();

  const handleClick = (label: string) => {
    messageApi.info(`${label} — 功能开发中`);
  };

  return (
    <div
      style={{
        height: 40,
        background: 'var(--bg-toolbar)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {contextHolder}
      <Space size={4}>
        <Tooltip title="Open (Ctrl+O)">
          <Button
            type="text"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={onOpenFile}
          />
        </Tooltip>
        <Tooltip title="Zoom">
          <Button
            type="text"
            size="small"
            icon={<DragOutlined />}
            onClick={() => handleClick('Zoom')}
          />
        </Tooltip>
        <Tooltip title="Reset">
          <Button
            type="text"
            size="small"
            icon={<CompressOutlined />}
            onClick={onReset}
          />
        </Tooltip>
        <Tooltip title="New Window">
          <Button
            type="text"
            size="small"
            icon={<PlusSquareOutlined />}
            onClick={() => handleClick('New Window')}
          />
        </Tooltip>
        <Tooltip title="Settings">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleClick('Settings')}
          />
        </Tooltip>
      </Space>
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        WaveView v1.0.6
      </span>
    </div>
  );
}
