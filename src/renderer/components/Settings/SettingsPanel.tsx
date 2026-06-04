import { Drawer, Switch, Slider, Space, Typography, Divider } from 'antd';
import { useSettingsStore } from '../../stores/settingsStore';

const { Text } = Typography;

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { theme, fontSize, setTheme, setFontSize } = useSettingsStore();

  return (
    <Drawer
      title="Settings"
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Theme</Text>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Text>Dark</Text>
              <Switch
                checked={theme === 'light'}
                onChange={(checked) => setTheme(checked ? 'light' : 'dark')}
              />
              <Text>Light</Text>
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <Text strong>Font Size</Text>
          <div style={{ marginTop: 8 }}>
            <Slider
              min={10}
              max={20}
              value={fontSize}
              onChange={setFontSize}
              marks={{
                10: '10',
                13: '13',
                16: '16',
                20: '20',
              }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Current: {fontSize}px
          </Text>
        </div>
      </Space>
    </Drawer>
  );
}
