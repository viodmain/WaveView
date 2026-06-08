import { Drawer, Switch, Slider, Space, Typography, Divider, Select, InputNumber } from 'antd';
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
    theme, fontSize, xAxisScale, yAxisScale, downsampleEnabled, downsampleThreshold,
    setTheme, setFontSize, setXAxisScale, setYAxisScale, setDownsampleEnabled, setDownsampleThreshold,
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

        <Divider />

        <div>
          <Text strong>Downsampling</Text>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Text>Disabled</Text>
              <Switch
                checked={downsampleEnabled}
                onChange={setDownsampleEnabled}
              />
              <Text>Enabled</Text>
            </Space>
          </div>
          {downsampleEnabled && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Threshold (points):</Text>
              <InputNumber
                value={downsampleThreshold}
                onChange={(v) => v && setDownsampleThreshold(v)}
                min={1000}
                max={50000}
                step={1000}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
          )}
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {downsampleEnabled
              ? `Auto downsample when data exceeds ${downsampleThreshold} points`
              : 'All data points will be rendered (may be slow for large files)'}
          </Text>
        </div>
      </Space>
    </Drawer>
  );
}
