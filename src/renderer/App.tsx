import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { useSettingsStore } from './stores/settingsStore';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';

const App: React.FC = () => {
  const { theme: appTheme } = useSettingsStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div className="app-container">
        <Workbench />
        <div className="main-content">
          <FileTree />
          <PlotArea />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;
