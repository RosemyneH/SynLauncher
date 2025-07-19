# Synastria WoW Launcher

A cross-platform Electron-based launcher for Synastria WoW with Windows and Linux support.

## Features
- **Cross-Platform Support**: Works on Windows and Linux
- **Linux Proton-GE Integration**: Automatically detects and uses Proton-GE for WoW on Linux
- **Smart Config Management**: Platform-aware configuration directories
- **WoW Client Management**: Downloads and manages WoW client via WebTorrent
- **Addon Management**: Install, update, and manage WoW addons
- **Patch System**: Automatic patch downloads and installation
- **Progress Tracking**: Real-time download and installation progress

## Platform Support

### Windows
- Native WoW execution
- Config stored in `%APPDATA%\Synastria`

### Linux
- Runs WoW via Proton-GE (Wine compatibility layer)
- Automatic Proton-GE detection
- Wine prefix management
- Config stored in `~/.config/synastria`
- Linux Settings panel for Proton configuration

## Requirements

### Windows
- Python (>=3.6)
- Visual Studio (with Desktop development with C++ workload)
- Node.js

### Linux
- Node.js
- [Proton-GE](https://github.com/GloriousEggroll/proton-ge-custom) (for WoW execution)
- Steam (recommended for Proton-GE installation)

## Installation

### From Releases
Download the appropriate package for your platform:
- **Windows**: `SynastriaLauncher-Setup.exe`
- **Linux**: `SynastriaLauncher.AppImage`, `.deb`, or `.rpm`

### From Source
1. Install dependencies: `npm install`
2. Run the launcher: `npm start`

### Building
- **Windows**: `npm run dist-win`
- **Linux**: `npm run dist-linux`
- **All platforms**: `npm run dist`

## Linux Setup

### Installing Proton-GE
1. Install Steam (if not already installed)
2. Download Proton-GE from [releases](https://github.com/GloriousEggroll/proton-ge-custom/releases)
3. Extract to `~/.steam/compatibilitytools.d/`
4. Restart the launcher to detect Proton-GE

### First-Time Linux Setup
1. Launch Synastria Launcher
2. Click "Linux Settings" when available
3. Initialize Wine Prefix if needed
4. Select WoW client directory (Windows files required)

## File Structure
- `main.js`: Electron main process
- `renderer.js`: UI logic and download handling
- `functions.js`: Utility functions
- `constants.js`: Constants and paths
- `platform.js`: Cross-platform utilities and Proton-GE detection
- `launcher.js`: Cross-platform WoW launcher with Proton-GE support
- `index.html`: UI

## Dependencies
- Electron
- WebTorrent
- Extract-zip
- Axios
- AdmZip

## Troubleshooting

### Linux Issues
- **No Proton-GE found**: Install Proton-GE from the official repository
- **Launch failures**: Try initializing Wine prefix in Linux Settings
- **Performance issues**: Check DXVK/VKD3D installation with your Proton-GE version
- **Audio issues**: Install additional audio codecs for Wine

### General Issues
- **Download failures**: Check internet connection and firewall settings
- **Addon issues**: Verify addon compatibility with WoW 3.3.5a
- **Patch failures**: Try downloading patch manually from Synastria website
