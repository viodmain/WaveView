# Changelog

## [0.2.0] - 2026-06-02

### 重大更新：核心功能完善与 Bug 修复

#### Bug 修复（22 个）

- **解析器修复**
  - trParser: 修复无空格分隔的科学计数法数值解析（正则提取）
  - trParser: 修复列名跨行截断自动合并（u6_16_di + e → u6_16_die）
  - acParser: 修复 #N 节点名续行丢失（12 个节点完整获取）
  - acParser: 修复引号未剥离、/ 分隔符导致 NaN
  - acParser: 修复多行 #C 数据块未收集、frequencies/allValues 长度不匹配
  - spParser: 修复 numPorts=0 静默失败（自动推断端口数）
  - spParser: 修复频率单位 GHz/MHz/kHz 未转换为 Hz
  - spParser: 修复 NaN 值传播导致数据丢失
  - spParser: 支持 RI/MA/DB 三种格式

- **主进程修复**
  - 修复 mainWindow! 空指针崩溃（关闭窗口时文件对话框打开）
  - 添加文件大小限制（500MB）

- **UI 修复**
  - 修复 ZoomMode 状态未传递给 Plotly（按钮无效果）
  - 修复 Workbench windows 闭包过期导致重复窗口
  - 修复深色主题 muted 颜色比 secondary 更亮
  - 修复 PlotArea onEdit 类型不匹配

- **构建修复**
  - 创建 tsconfig.main.json（CommonJS 模块）
  - 添加缺失的 ESLint 依赖
  - dev 脚本支持主进程 watch

#### 新增功能

- **Reset 按钮** — Plotly relayout 重置所有轴到自动范围
- **Zoom/Pan 模式切换** — 工具栏按钮联动 Plotly dragmode
- **可拖拽面板布局** — FileTree 和 PlotArea 之间可拖拽调整宽度（react-split-pane）
- **波形选中高亮** — 选中的波形节点显示蓝色阴影和高亮文字
- **原生应用菜单**
  - File > Open (Ctrl+O)
  - View > Toggle Dark Theme (Ctrl+Shift+D)
  - View > Reload/DevTools/Zoom 控制
  - Help > About
- **跨窗口 X 轴同步** — 一个窗口缩放/平移时其他窗口自动跟随（可在设置中开关）
- **数据降采样** — 超过 5000 点自动降采样（LTTB 算法，>100k 点用 min-max）
- **动态轴标签** — 根据波形单位自动显示 Time/Frequency/Voltage 等
- **X 轴单位校验** — 禁止不同 X 轴单位的曲线混搭（如 Time 和 Frequency）
- **双 Y 轴** — 同窗口不同 Y 轴单位时自动分配左右轴
- **设置面板** — 主题切换、字体大小、X 轴同步开关
- **设置持久化** — zustand/persist 存储到 localStorage
- **文件树单位标签** — 每个文件旁显示 Time(s)/Freq(Hz) 标签
- **错误提示** — Ant Design message 显示解析错误/成功信息
- **单元测试** — 29 个测试用例覆盖三个解析器和降采样工具

#### 多平台打包配置

- Windows: NSIS 安装程序（x64）
- macOS: DMG（x64 + arm64）
- Linux: AppImage + deb（x64）

## [0.1.0] - 2026-06-01

### 项目初始化

#### 新增功能
- Electron 主进程（窗口创建、文件对话框）
- React 渲染进程（Workbench、FileTree、PlotArea、PlotWindow）
- 文件解析器（tr0、ac0、s*p）
- 状态管理（fileStore、waveStore、settingsStore）
- 开发工具配置（TypeScript、Vite、ESLint、Prettier）
