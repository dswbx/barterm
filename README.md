# Barterm

A modern macOS menubar terminal application built with Tauri v2, React, and TypeScript.

## Features

- **Menubar Integration**: Lives in your macOS menubar, accessible with a single click
- **Multiple Tabs**: Support for multiple terminal sessions with easy tab management
- **System Theme**: Automatically follows macOS light/dark mode
- **Keyboard Shortcuts**: Fast navigation with keyboard shortcuts
- **Modern UI**: Clean, minimal interface with smooth animations

## Keyboard Shortcuts

- `Cmd+T` - New tab
- `Cmd+W` - Close current tab
- `Cmd+1-9` - Switch to tab 1-9

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18 or later)
- macOS 10.15 or later

## Development

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run tauri:dev
```

## Build

Build the application:

```bash
npm run tauri:build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Terminal**: xterm.js v6 with fit addon
- **Backend**: Tauri v2 (Rust)
- **PTY**: tauri-plugin-pty

## Architecture

The app uses a system tray icon that toggles a popover window. The window contains a React app with:

- Tab bar for managing multiple terminal sessions
- xterm.js instances (one per tab, kept alive when hidden)
- PTY backend in Rust that spawns shell processes

Terminal sessions persist while the app is running but are not saved between restarts.

## License

MIT
