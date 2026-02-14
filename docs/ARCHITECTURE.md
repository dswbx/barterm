# Architecture

Barterm is a macOS menubar terminal application built with Tauri, React, and xterm.js.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **xterm.js** - Terminal emulator
- **Base UI** - Headless UI components (Switch)

### Backend
- **Tauri 2** - Native app framework (Rust)
- **tauri-plugin-pty** - PTY (pseudo-terminal) support
- **tauri-plugin-store** - Persistent key-value storage
- **tauri-plugin-notification** - System notifications
- **tauri-plugin-shell** - Shell operations

## Project Structure

```
barterm/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── Terminal.tsx          # Terminal component (xterm.js wrapper)
│   │   ├── TerminalManager.tsx   # Main app logic, tab management
│   │   └── TabBar.tsx            # Tab navigation UI
│   ├── contexts/
│   │   └── SettingsContext.tsx   # Global settings state
│   ├── hooks/
│   │   └── usePty.ts             # PTY management hook
│   ├── lib/
│   │   └── theme.ts              # Theme utilities
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Backend source (Rust)
│   ├── src/
│   │   └── lib.rs                # Main Rust code
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri configuration
│   └── icons/                    # App icons
├── docs/                         # Documentation
└── public/                       # Static assets
```

## Core Components

### Terminal Component
- Wraps xterm.js with React
- Handles terminal rendering and user input
- Manages terminal lifecycle (mount, resize, dispose)
- Exposes imperative handle for parent control

### TerminalManager
- Manages multiple terminal tabs
- Handles keyboard shortcuts (Cmd+T, Cmd+W, Cmd+1-9)
- Coordinates PTY sessions with terminal instances
- Manages bell notifications and tray badge
- Handles window visibility and positioning
- Contains Settings UI

### PTY Hook (usePty)
- Creates and manages PTY processes via Tauri
- Handles bidirectional data flow (terminal ↔ PTY)
- Manages PTY lifecycle per tab
- Handles resize events

### Settings Context
- Centralized settings management
- Type-safe settings interface
- Automatic persistence via Tauri store
- React Context for global access

## Data Flow

### Terminal Input/Output
```
User Input → Terminal Component → usePty Hook → Tauri Command → PTY Process
                                                                      ↓
User Display ← Terminal Component ← usePty Hook ← Tauri Event ← PTY Output
```

### Settings
```
UI Component → useSettings Hook → Tauri Command → Store (settings.json)
                                                           ↓
UI Component ← useSettings Hook ← Tauri Command ← Store (on load)
```

### Notifications
```
PTY Bell → Terminal Component → TerminalManager → System Notification
                                                 → Tray Badge Update
```

## Window Management

### Positioning
- Window positioned below tray icon on show
- Calculated based on tray icon position and window size
- 5px gap between tray and window

### Visibility
- Hidden by default on launch
- Toggled via tray icon left-click
- Auto-hides on Cmd+W (if single tab)
- Always on top when visible

### Size Persistence
- Window size saved on resize (debounced 500ms)
- Restored on next launch
- Stored in settings.json

## Tray Icon

### Left Click
- Toggles window visibility
- Positions window below tray icon

### Right Click
- Shows context menu:
  - About Barterm
  - Settings
  - Open Config
  - Quit

### Badge
- Shows when terminal bell rings in background
- Clears when window is focused
- Visual indicator: icon-badge.png

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+T | New tab |
| Cmd+W | Close tab (or window if last tab) |
| Cmd+1-9 | Switch to tab 1-9 |

## Platform-Specific Features

### macOS
- Uses `ActivationPolicy::Accessory` to hide dock icon
- Integrates with macOS notification system
- Template icon for tray (adapts to light/dark mode)
- Native window decorations for About window

## Performance Optimizations

- Debounced window resize saves (500ms)
- Terminal refs stored in Map for O(1) access
- Lazy loading of settings
- Optimistic UI updates for settings
- Conditional rendering (only active tab visible)

## Security

- No eval() or dynamic code execution
- CSP disabled (null) for xterm.js compatibility
- Sandboxed capabilities per window
- Store plugin for secure persistence
- No network access required for core functionality
