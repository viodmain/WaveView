import { Tabs, Button, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useWindowStore } from '../../stores/windowStore';

export default function WindowTabs() {
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const setActiveWindow = useWindowStore((s) => s.setActiveWindow);
  const createWindow = useWindowStore((s) => s.createWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);

  const items = windows.map((w) => ({
    key: w.id,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {w.title}
        {windows.length > 1 && (
          <CloseOutlined
            style={{ fontSize: 10, color: 'var(--text-secondary)' }}
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(w.id);
            }}
          />
        )}
      </span>
    ),
  }));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-toolbar)',
        borderBottom: '1px solid var(--border)',
        paddingRight: 8,
      }}
    >
      <Tabs
        type="card"
        size="small"
        activeKey={activeWindowId ?? undefined}
        items={items}
        onChange={(key) => setActiveWindow(key)}
        style={{ flex: 1, margin: 0 }}
        tabBarStyle={{ margin: 0, borderBottom: 'none' }}
      />
      <Tooltip title="New Window">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={createWindow}
        />
      </Tooltip>
    </div>
  );
}
