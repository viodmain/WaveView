import { ConfigProvider, theme } from 'antd';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4,
        },
      }}
    >
      <div style={{ padding: 24, color: '#fff' }}>
        <h1>WaveView</h1>
        <p>Electron + React 环境搭建成功 ✅</p>
      </div>
    </ConfigProvider>
  );
}
