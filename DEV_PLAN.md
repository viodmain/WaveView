# WaveView 开发计划

## 一、项目概述

WaveView 是一款波形查看软件，用于解析和绘制瞬态分析结果文件（*.tr*、*ac*）和S参数仿真文件（*.s*p）。支持波形曲线的拖动、缩放等交互功能。

## 二、技术栈选型

| 类别 | 技术选择 | 说明 |
|------|---------|------|
| 框架 | Electron + React | 跨平台桌面应用 |
| 语言 | TypeScript | 类型安全，提高代码质量 |
| UI组件库 | Ant Design | 成熟的React组件库 |
| 波形渲染 | Apache ECharts（官方包直接引入） | 科学绘图，按需引入，无第三方封装 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 文件解析 | 自定义解析器 | 解析标准SPICE格式文件 |
| 构建工具 | Vite + electron-builder | 快速开发和打包 |

## 三、项目结构

```
WaveView/
├── src/
│   ├── main/                    # Electron主进程
│   │   ├── main.ts              # 主进程入口
│   │   ├── preload.ts           # 预加载脚本（contextBridge）
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
│   │   │       └── EChartsWrapper.tsx  # ECharts 封装（自写，~50行）
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
├── package.json              # 含 electron-builder 配置
├── tsconfig.json             # 渲染进程 TypeScript 配置
├── tsconfig.main.json        # 主进程 TypeScript 配置（CommonJS）
└── vite.config.ts            # Vite 构建配置
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

使用 Apache ECharts（官方包直接引入，自写薄封装）实现：
- 多波形叠加显示
- 鼠标滚轮缩放（dataZoom）
- 左键拖动平移
- 多窗口支持
- 坐标轴标注（带单位）
- 按需引入：LineChart + CanvasRenderer，控制体积

### 4.5 工具栏模块

| 功能 | 图标 | 说明 |
|------|------|------|
| Open | 📂 | 打开文件对话框 |
| Zoom | 🔍 | 框选放大 |
| Reset | 🔄 | 重置视图 |
| New Window | ➕ | 创建新绘图窗口 |
| Settings | ⚙️ | 主题、字体设置 |

## 五、开发阶段

### 第一阶段：开发环境与打包环境搭建（1-2天）

**目标：跑通完整的 开发→构建→打包→运行 流程，后续开发只需关注业务代码。**

#### 1.1 基础项目搭建

- [ ] 创建 `src/` 目录结构（main / renderer / shared）
- [ ] 安装依赖（`npm install`）
- [ ] 配置 Electron 主进程入口（`src/main/main.ts`）
- [ ] 配置渲染进程入口（`src/renderer/index.html` + `src/renderer/main.tsx`）
- [ ] 配置 preload 脚本（`src/main/preload.ts`）
- [ ] 实现主进程与渲染进程 IPC 通信骨架

#### 1.2 开发环境验证

- [ ] `npm run dev:vite` — Vite 开发服务器正常启动，浏览器可访问
- [ ] `npm run dev:electron` — Electron 窗口正常打开，渲染进程加载成功
- [ ] `npm run dev` — 并发启动 Vite + Electron，热更新正常工作
- [ ] TypeScript 类型检查通过（`tsc --noEmit`）
- [ ] ESLint 检查通过

#### 1.3 构建与打包验证

- [ ] `npm run build:vite` — Vite 生产构建成功，输出到 `dist/renderer/`
- [ ] `npm run build:electron` — 主进程编译成功，输出到 `dist/main/`
- [ ] `npm run build` — electron-builder 打包成功
  - [ ] Windows: NSIS 安装程序生成
  - [ ] Linux: AppImage / deb 生成
- [ ] 打包后的应用能正常启动并显示窗口
- [ ] 验证生产环境无白屏、无控制台报错

#### 1.4 开发工具链完善

- [ ] `.gitignore` 覆盖 `dist/`、`release/`、`node_modules/`
- [ ] Prettier 格式化正常工作
- [ ] Vitest 测试框架可运行（空测试用例即可）

**阶段验收标准：** 新克隆仓库后，执行 `npm install && npm run dev` 即可看到 Electron 窗口；执行 `npm run build` 即可得到可分发的安装包。

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

---

### 第二阶段：UI Demo — 完整界面搭建（2-3天）

**目标：运行程序后能看到完整的 UI 骨架，所有区域用 mock 数据填充，可直观感受最终产品的布局和交互风格。**

#### 2.1 全局布局与主题

- [ ] 实现 VSCode 风格深色主题（CSS 变量 / Ant Design token 配置）
- [ ] 实现三栏可拖拽布局：顶部 Workbench + 左侧 FileTree + 右侧 PlotArea（react-split-pane）
- [ ] 全局样式：字体、间距、背景色统一

#### 2.2 Workbench 工具栏

- [ ] 渲染工具栏按钮：Open、Zoom、Reset、New Window、Settings
- [ ] 按钮使用 Ant Design Icon，带 hover 提示
- [ ] 按钮点击可触发 message 提示（mock 行为，不做真实功能）

#### 2.3 FileTree 目录树

- [ ] 用 mock 数据渲染文件树结构（文件节点 → 波形子节点）
- [ ] 实现节点展开/折叠
- [ ] 实现波形节点点击高亮（选中蓝色阴影）

#### 2.4 PlotArea 绘图区

- [ ] 按需引入 ECharts（LineChart + CanvasRenderer），自写 EChartsWrapper 组件
- [ ] 用 mock 数据绘制一条正弦波
- [ ] 鼠标滚轮缩放、左键拖动平移（dataZoom）
- [ ] 坐标轴标注（带单位）
- [ ] 工具栏 Zoom/Reset 按钮联动 ECharts dispatchAction

#### 2.5 状态管理骨架

- [ ] 创建 Zustand store：fileStore、waveStore、settingsStore（含 mock 初始数据）
- [ ] FileTree 点击波形 → waveStore 更新 → PlotArea 响应重绘

**阶段验收标准：** `npm run dev` 启动后，用户看到完整的深色主题三栏界面；左侧目录树可展开折叠、点击高亮；右侧绘图区显示 mock 波形，支持缩放拖动；工具栏按钮有视觉反馈。

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

---

### 第三阶段：文件解析（2-3天）

- [ ] 实现 tr0 文件解析器
- [ ] 实现 ac0 文件解析器
- [ ] 实现 s*p 文件解析器
- [ ] 编写解析器单元测试
- [ ] 使用 `file_example/` 示例文件验证解析结果

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

### 第四阶段：文件导入与真实数据串联（2-3天）

- [ ] 实现文件对话框（Electron dialog）
- [ ] ~~拖拽导入~~（待定）
- [ ] 解析结果写入 fileStore → FileTree 自动更新
- [ ] FileTree 点击波形 → 用真实数据重绘 PlotArea
- [ ] 波形单位自动识别，坐标轴动态标注
- [ ] 错误提示（文件格式不支持、解析失败）

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

### 第五阶段：高级绘图功能（2-3天）

- [ ] 单窗口多波形叠加显示
- [ ] 框选放大功能
- [ ] Reset 视图功能
- [ ] X 轴单位校验（禁止 Time 和 Frequency 混搭）

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

### 第六阶段：多窗口支持（2天）

- [ ] 实现窗口创建/关闭
- [ ] 实现窗口布局管理

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

### 第七阶段：优化与打包（2-3天）

- [ ] 性能优化（大数据量、Web Worker 解析）
- [ ] 错误处理和边界情况
- [ ] 设置面板（主题切换、字体大小、X 轴同步开关）
- [ ] 设置持久化（localStorage）
- [ ] 最终打包测试

**📤 交付测试：** `npm run build` 打包，提供安装包给用户测试。

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
- ECharts Canvas 渲染（默认，性能足够）

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
| ECharts 按需引入配置复杂 | 仅引入 LineChart + CanvasRenderer，控制体积 |
| 跨平台兼容性 | 优先保证Windows，后续扩展Mac/Linux |

---

*文档版本: v1.1*
*创建日期: 2026-06-01*
*更新日期: 2026-06-03*