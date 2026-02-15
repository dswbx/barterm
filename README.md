# Barterm

A modern macOS menubar terminal application built with Tauri v2, React, and TypeScript.

![Barterm Screenshot](docs/screenshot.png)

## Features

- **Menubar Integration**: Lives in your macOS menubar, accessible with a single click
- **Multiple Tabs**: Support for multiple terminal sessions with easy tab management
- **Smart Notifications**: Get notified when commands complete in background tabs
- **Persistent Settings**: Window size and preferences automatically saved
- **System Theme**: Automatically follows macOS light/dark mode
- **Keyboard Shortcuts**: Fast navigation with keyboard shortcuts (Cmd+T, Cmd+W, Cmd+M, Cmd+1-9)
- **Tray Menu**: Right-click for quick access to settings, config, and more
- **Modern UI**: Clean, minimal interface with smooth animations

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture and component overview
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, development workflow, and contributing
- **[Settings System](docs/SETTINGS.md)** - How to add and manage settings
- **[Keyboard Shortcuts](docs/KEYBOARD_SHORTCUTS.md)** - Complete list of shortcuts
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Implementation Details](docs/IMPLEMENTATION.md)** - Technical implementation notes
- **[Notification Behavior](docs/NOTIFICATION_BEHAVIOR.md)** - How notifications work

## Installation

Download the latest `.dmg` from [Releases](../../releases), open it and drag Barterm to your Applications folder.

Since the app is not signed with an Apple Developer certificate, macOS will block it on first launch. To fix this, run:

```bash
xattr -cr /Applications/Barterm.app
```

Then open the app normally. You only need to do this once.

## Requirements

- macOS 10.15 or later (Apple Silicon)
- [Rust](https://www.rust-lang.org/tools/install) (for development)
- [Node.js](https://nodejs.org/) v18+ (for development)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Terminal**: xterm.js v6 with fit addon
- **Backend**: Tauri v2 (Rust)
- **Plugins**: PTY, Store, Notifications, Shell

## Usage

### Tray Icon
- **Left-click**: Toggle window visibility
- **Right-click**: Open context menu (About, Settings, Open Config, Quit)

### Keyboard Shortcuts
- `Cmd+T` - New tab
- `Cmd+W` - Close current tab
- `Cmd+M` - Hide barterm
- `Cmd+Shift+W` - Close all tabs and hide barterm
- `Cmd+1-9` - Switch to tab 1-9

See [KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) for complete list.

## Settings

Settings are stored in `~/Library/Application Support/com.barterm.app/settings.json`

Access via:
- Right-click tray icon → Settings
- Right-click tray icon → Open Config (opens in default editor)

See [SETTINGS.md](docs/SETTINGS.md) for how to add new settings.

## Contributing

Contributions are welcome! Please see [DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup and guidelines.

## License

MIT
