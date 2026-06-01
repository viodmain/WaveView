# WaveView 开发计划

## 一、项目概述

WaveView 是一款波形查看软件，用于解析和绘制瞬态分析结果文件（*.tr*、*ac*）和S参数仿真文件（*.s*p）。支持波形曲线的拖动、缩放等交互功能。

## 二、技术栈选型

| 类别 | 技术选择 | 说明 |
|------|---------|------|
| 框架 | Electron + React | 跨平台桌面应用 |
| 语言 | TypeScript | 类型安全，提高代码质量 |
| UI组件库 | Ant Design | 成熟的React组件库 |
| 波形渲染 | Plotly.js | 专业科学绘图，支持缩放/拖动 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 文件解析 | 自定义解析器 | 解析标准SPICE格式文件 |
| 构建工具 | Vite + electron-builder | 快速开发和打包 |

## 三、项目结构

```
WaveView/
├── src/
│   ├── main/                    # Electron主进程
│   │   ├── main.ts              # 主进程入口
│   │   ├── menu.ts              # 菜单配置
│   │   └── ipc.ts               # IPC通信处理
│   │
│   ├── renderer/                # 渲染进程
│   │   ├── App.tsx              # 应用入口
│   │   ├── components/          # React组件
│   │   │   ├── Workbench/       # 顶部工具栏
│   │   │   │   ├── Workbench.tsx
│   │   │   │   ├── FileImport.tsx
│   │   │   │   ├── ZoomControl.tsx
│   │   │   │   ├── WindowControl.tsx
│   │   │   │   └── Settings.tsx
│   │   │   │
│   │   │   ├── FileTree/        # 左侧目录树
│   │   │   │   ├── FileTree.tsx
│   │   │   │   ├── FileNode.tsx
│   │   │   │   └── WaveNode.tsx
│   │   │   │
│   │   │   └── PlotArea/        # 右侧绘图区域
│   │   │       ├── PlotArea.tsx
│   │   │       ├── PlotWindow.tsx
│   │   │       └── WaveformPlot.tsx
│   │   │
│   │   ├── stores/              # 状态管理
│   │   │   ├── fileStore.ts     # 文件状态
│   │   │   ├── waveStore.ts     # 波形状态
│   │   │   └── settingsStore.ts # 设置状态
│   │   │
│   │   ├── parsers/             # 文件解析器
│   │   │   ├── parserFactory.ts # 解析器工厂
│   │   │   ├── trParser.ts      # tr0文件解析
│   │   │   ├── acParser.ts      # ac0文件解析
│   │   │   └── spParser.ts      # s*p文件解析
│   │   │
│   │   ├── utils/               # 工具函数
│   │   │   ├── fileUtils.ts
│   │   │   └── mathUtils.ts
│   │   │
│   │   └── styles/              # 样式文件
│   │       ├── global.css
│   │       └── themes/
│   │
│   └── shared/                  # 共享类型定义
│       └── types.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

## 四、核心功能模块

### 4.1 文件解析模块

#### 支持的文件格式
- **瞬态分析文件**: *.tr0, *.tr1, *.tr2...
- **交流分析文件**: *.ac0, *.ac1...
- **S参数文件**: *.s1p, *.s2p, *.s3p, *.s4p...

#### 解析器接口设计
```typescript
interface WaveformData {
  name: string;           // 波形名称
  xData: number[];        // X轴数据（时间/频率）
  yData: number[];        // Y轴数据（电压/电流/S参数）
  unit: { x: string; y: string }; // 单位
}

interface FileParser {
  canParse(filename: string): boolean;
  parse(content: string): ParsedFile;
}

interface ParsedFile {
  filename: string;
  waveforms: WaveformData[];
  metadata: Record<string, any>;
}
```

### 4.2 布局模块

采用可拖拽分割面板实现三栏布局：
- **Workbench**: 固定高度顶部栏，包含工具按钮
- **FileTree**: 可调宽度左侧面板
- **PlotArea**: 自适应右侧面板，支持多窗口

### 4.3 目录树模块

功能点：
- 文件节点：显示已加载的文件名
- 波形节点：展开文件后显示所有波形
- 选中状态：点击波形节点添加阴影标识
- 交互：点击绘制/取消绘制波形

### 4.4 绘图模块

使用 Plotly.js 实现：
- 多波形叠加显示
- 鼠标滚轮缩放
- 左键拖动平移
- 多窗口支持
- 坐标轴标注（带单位）

### 4.5 工具栏模块

| 功能 | 图标 | 说明 |
|------|------|------|
| Open | 📂 | 打开文件对话框 |
| Zoom | 🔍 | 框选放大 |
| Reset | 🔄 | 重置视图 |
| New Window | ➕ | 创建新绘图窗口 |
| Settings | ⚙️ | 主题、字体设置 |

## 五、开发阶段

### 第一阶段：项目初始化（1-2天）

- [ ] 初始化Electron + React + TypeScript项目
- [ ] 配置Vite构建工具
- [ ] 配置ESLint、Prettier
- [ ] 搭建基本项目结构
- [ ] 实现主进程与渲染进程通信

### 第二阶段：文件解析（2-3天）

- [ ] 实现tr0文件解析器
- [ ] 实现ac0文件解析器
- [ ] 实现s*p文件解析器
- [ ] 编写解析器单元测试
- [ ] 使用示例文件验证解析结果

### 第三阶段：UI布局（2-3天）

- [ ] 实现三栏可拖拽布局
- [ ] 实现Workbench工具栏
- [ ] 实现文件导入功能（文件对话框）
- [ ] 实现VSCode风格主题
- [ ] 支持主题色和字体大小调整

### 第四阶段：目录树（1-2天）

- [ ] 实现文件树组件
- [ ] 实现节点展开/折叠
- [ ] 实现波形选中状态（阴影效果）
- [ ] 实现点击事件与波形绑定

### 第五阶段：波形绘制（3-4天）

- [ ] 集成Plotly.js
- [ ] 实现单窗口多波形显示
- [ ] 实现鼠标滚轮缩放
- [ ] 实现左键拖动平移
- [ ] 实现框选放大功能
- [ ] 实现Reset视图功能

### 第六阶段：多窗口支持（2天）

- [ ] 实现窗口创建/关闭
- [ ] 实现窗口布局管理
- [ ] 实现跨窗口波形同步

### 第七阶段：优化与测试（2-3天）

- [ ] 性能优化（大数据量处理）
- [ ] 错误处理和边界情况
- [ ] 用户体验优化
- [ ] 打包发布配置

## 六、关键技术点

### 6.1 SPICE文件解析

根据示例文件分析，支持以下格式：

#### tr0文件格式（瞬态分析）
```
- 第1行：仿真信息头
- 第2行：版权信息
- 第3行：标记值（如0）
- 第4行：列数标记（如 1 1 1 1 1 1）
- 第5行：列名（TIME, u5_10, u6_16, ...）
- 第6行起：数据行，空格分隔的科学计数法数值
- X轴：TIME（时间，单位秒）
- Y轴：电压/电流值
```

#### ac0文件格式（交流分析）
```
- #H行：头部信息（SOURCE, VERSION, TITLE, ANALYSIS等）
- #N行：节点名称列表（如 v(nnn15681), v(nnn15518)）
- #C行：复数数据，格式为 "频率 节点数 实部/虚部 实部/虚部 ..."
- X轴：频率（Hz）
- Y轴：复数电压（幅度和相位）
```

#### s*p文件格式（S参数，Touchstone标准）
```
- ! 开头：注释行
- # 行：格式定义（单位 参数类型 格式 参考阻抗）
  示例：# HZ S  RI R 50
  - HZ: 频率单位（Hz）
  - S: S参数类型
  - RI: Real/Imaginary格式（也可用MA: 幅度/相位，DB: dB/相位）
  - R 50: 参考阻抗50欧姆
- 数据行：频率 S11_re S11_im S21_re S21_im S12_re S12_im S22_re S22_im
- s2p: 2端口，每行9个值
- s4p: 4端口，每行33个值（可能跨多行）
```

### 6.2 大数据量优化

- 使用Web Worker进行文件解析
- 实现数据降采样显示
- Plotly.js的WebGL渲染模式

### 6.3 状态管理

```typescript
// 文件状态
interface FileStore {
  files: Map<string, ParsedFile>;
  addFile(file: ParsedFile): void;
  removeFile(filename: string): void;
}

// 波形状态
interface WaveStore {
  activeWaves: Map<string, Set<string>>; // windowId -> waveNames
  toggleWave(windowId: string, filename: string, waveName: string): void;
}

// 设置状态
interface SettingsStore {
  theme: 'light' | 'dark';
  fontSize: number;
  setTheme(theme: string): void;
  setFontSize(size: number): void;
}
```

## 七、预期交付物

1. 可运行的Electron桌面应用
2. 完整的源代码（含注释）
3. 单元测试
4. 打包后的安装程序（Windows）
5. 用户使用手册

## 八、风险与注意事项

| 风险 | 应对措施 |
|------|---------|
| 文件格式解析错误 | 充分测试示例文件，做好错误处理 |
| 大文件性能问题 | 使用Web Worker，实现数据降采样 |
| Plotly.js定制性有限 | 必要时可切换到Canvas自绘 |
| 跨平台兼容性 | 优先保证Windows，后续扩展Mac/Linux |

---

*文档版本: v1.0*
*创建日期: 2026-06-01*