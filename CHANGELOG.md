# Changelog

## [0.1.0] - 2026-06-01

### 项目初始化

#### 新增功能
- **Electron 主进程**
  - 创建应用窗口
  - 实现文件对话框（支持多选）
  - 支持 SPICE 文件格式过滤

- **React 渲染进程**
  - 应用入口和布局组件
  - Workbench 工具栏（Open、Zoom、Reset、New Window、Settings）
  - FileTree 目录树组件（支持波形选择）
  - PlotArea 绘图区域（支持多窗口）
  - PlotWindow 波形绘制组件（基于 Plotly.js）

- **文件解析器**
  - tr0 文件解析（瞬态分析）
  - ac0 文件解析（交流分析）
  - s*p 文件解析（S 参数，Touchstone 格式）

- **状态管理**
  - fileStore：文件状态管理
  - waveStore：波形和窗口状态管理
  - settingsStore：应用设置管理

- **开发工具配置**
  - TypeScript 配置
  - Vite 构建配置
  - ESLint 代码检查
  - Prettier 代码格式化

#### 技术栈
- Electron + React + TypeScript
- Ant Design UI 组件库
- Zustand 状态管理
- Plotly.js 波形渲染

#### 待完成
- [ ] 安装项目依赖
- [ ] 完善 UI 样式
- [ ] 实现波形交互功能（缩放、拖动）
- [ ] 实现设置面板
- [ ] 打包发布配置
