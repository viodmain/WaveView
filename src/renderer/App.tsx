import React, { useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import SplitPane from 'react-split-pane';
import { useSettingsStore } from './stores/settingsStore';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';

const App: React.FC = () => {
  const { theme: appTheme, fontSize } = useSettingsStore();

  // Apply theme and font size to the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [appTheme, fontSize]);

  return (
    <ConfigProvider
      theme={{
        algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontSize: fontSize,
        },
      }}
    >
      <div className="app-container">
        <Workbench />
        <div className="main-content">
          <SplitPane
            split="vertical"
            minSize={150}
            defaultSize={250}
            style={{ position: 'relative' }}
            paneStyle={{ display: 'flex', flexDirection: 'column' }}
          >
            <FileTree />
            <PlotArea />
          </SplitPane>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;
