import { Drawer, Switch, Slider, Space, Typography, Divider, Select } from 'antd';
import { useSettingsStore, type AxisScale } from '../../stores/settingsStore';

const { Text } = Typography;

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const axisScaleOptions = [
  { value: 'linear', label: 'Linear' },
  { value: 'log', label: 'Logarithmic (base 10)' },
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    theme, fontSize, xAxisScale, yAxisScale,
    setTheme, setFontSize, setXAxisScale, setYAxisScale,
  } = useSettingsStore();

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

        <Divider />

        <div>
          <Text strong>X-Axis Scale</Text>
          <div style={{ marginTop: 8 }}>
            <Select
              value={xAxisScale}
              onChange={(value: AxisScale) => setXAxisScale(value)}
              options={axisScaleOptions}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div>
          <Text strong>Y-Axis Scale</Text>
          <div style={{ marginTop: 8 }}>
            <Select
              value={yAxisScale}
              onChange={(value: AxisScale) => setYAxisScale(value)}
              options={axisScaleOptions}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
