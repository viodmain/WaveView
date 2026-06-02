import React, { useEffect } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import SplitPane from 'react-split-pane';
import { useSettingsStore } from './stores/settingsStore';
import { useFileStore } from './stores/fileStore';
import { useWaveStore } from './stores/waveStore';
import { parseFile } from './parsers/parserFactory';
import Workbench from './components/Workbench/Workbench';
import FileTree from './components/FileTree/FileTree';
import PlotArea from './components/PlotArea/PlotArea';

const App: React.FC = () => {
  const { theme: appTheme, fontSize, setTheme } = useSettingsStore();
  const { addFile } = useFileStore();
  const { addWindow } = useWaveStore();

  // Apply theme and font size to the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [appTheme, fontSize]);

  // Listen for menu events from main process
  useEffect(() => {
    // Handle files opened from menu
    window.electronAPI.onFilesOpened((files) => {
      let hasError = false;
      files.forEach((file) => {
        const parsed = parseFile(file.name, file.content);
        if (parsed) {
          addFile(parsed);
          if (parsed.metadata?.error) hasError = true;
        } else {
          hasError = true;
        }
      });

      const { windows } = useWaveStore.getState();
      if (windows.length === 0) addWindow();

      if (hasError) {
        message.warning('Some files could not be parsed correctly.');
      } else {
        message.success(`Loaded ${files.length} file(s).`);
      }
    });

    // Handle theme toggle from menu
    window.electronAPI.onThemeToggle(() => {
      const { theme: currentTheme } = useSettingsStore.getState();
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }, [addFile, addWindow, setTheme]);

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
