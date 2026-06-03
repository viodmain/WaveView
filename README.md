# WaveView

A waveform viewer for SPICE simulation files. Built with Electron + React + TypeScript.

## Features

- **File Import** — Open SPICE simulation files via file dialog (Ctrl+O)
- **Supported Formats**
  - Transient analysis: `.tr0`, `.tr1`, `.tr2` (two formats supported)
  - AC analysis: `.ac0`, `.ac1`
  - S-parameters: `.s1p`, `.s2p`, `.s3p`, `.s4p` (Touchstone format)
- **Waveform Display**
  - Multiple waveforms overlay
  - Scientific notation axes
  - Dynamic axis labels based on units
- **Zoom & Pan**
  - Mouse wheel zoom (both axes)
  - Ctrl + wheel: X-axis only
  - Shift + wheel: Y-axis only
  - Box zoom (drag to select area)
  - Reset view
- **File Tree** — Expandable tree with checkbox selection
- **Dark Theme** — VSCode-style dark UI
- **Cross Platform** — Windows, macOS, Linux

## Screenshots

<!-- Add screenshots here -->

## Installation

Download the latest installer from [Releases](https://github.com/viodmain/WaveView/releases).

### Windows
Run `WaveView Setup x.x.x.exe`

### macOS
Open `WaveView-x.x.x.dmg`

### Linux
```bash
# AppImage
chmod +x WaveView-x.x.x.AppImage
./WaveView-x.x.x.AppImage

# Debian/Ubuntu
sudo dpkg -i waveview_x.x.x_amd64.deb
```

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# Clone the repository
git clone https://github.com/viodmain/WaveView.git
cd WaveView

# Install dependencies
npm install

# Start development
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Build renderer only
npm run build:vite

# Build main process only
npm run build:electron
```

### Test

```bash
npm run test
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Electron + React |
| Language | TypeScript |
| UI Library | Ant Design |
| Waveform Rendering | Apache ECharts |
| State Management | Zustand |
| Build Tool | Vite + electron-builder |

## Project Structure

```
WaveView/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Main entry
│   │   ├── preload.ts           # Preload script
│   │   └── ...
│   ├── renderer/                # React renderer
│   │   ├── App.tsx              # App entry
│   │   ├── components/          # UI components
│   │   │   ├── Workbench/       # Top toolbar
│   │   │   ├── FileTree/        # Left sidebar
│   │   │   └── PlotArea/        # Chart area
│   │   ├── parsers/             # File parsers
│   │   ├── stores/              # Zustand stores
│   │   └── styles/              # CSS
│   └── shared/                  # Shared types
├── file_example/                # Example files
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## License

[MIT](LICENSE) © [viodmain](https://github.com/viodmain)
