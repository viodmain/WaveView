import { Button, Tooltip, Space } from 'antd';
import {
  FolderOpenOutlined,
  DragOutlined,
  CompressOutlined,
  PlusSquareOutlined,
  SettingOutlined,
} from '@ant-design/icons';

interface WorkbenchProps {
  onOpenFile?: () => void;
  onPan?: () => void;
  onReset?: () => void;
  onNewWindow?: () => void;
  onOpenSettings?: () => void;
  isPanMode?: boolean;
}

export default function Workbench({ onOpenFile, onPan, onReset, onNewWindow, onOpenSettings, isPanMode }: WorkbenchProps) {
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
      <Space size={4}>
        <Tooltip title="Open (Ctrl+O)">
          <Button
            type="text"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={onOpenFile}
          />
        </Tooltip>
        <Tooltip title="Pan (Drag to move)">
          <Button
            type={isPanMode ? 'primary' : 'text'}
            size="small"
            icon={<DragOutlined />}
            onClick={onPan}
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
            onClick={onNewWindow}
          />
        </Tooltip>
        <Tooltip title="Settings">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
          />
        </Tooltip>
      </Space>
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        WaveView v1.1.21
      </span>
    </div>
  );
}
