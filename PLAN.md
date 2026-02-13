# Barterm — macOS Menubar Terminal

## Overview
Menubar-only terminal app. Popover panel drops from tray icon. Tabs for multiple sessions. Sessions persist while app runs (lost on quit). Follows system light/dark mode. Uses `$SHELL`.

## Tech Stack
- **Tauri v2** (Rust backend)
- **React + TypeScript + Vite** (frontend)
- **Tailwind CSS** (styling)
- **xterm.js** + xterm-addon-fit (terminal emulation)
- **tauri-plugin-pty** (Tnze/tauri-plugin-pty — Rust PTY bridge)

## Architecture

```
┌─────────────────────────────────┐
│  macOS Menubar (TrayIcon)       │
│  Click → toggle popover window  │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  Tauri Window (popover panel)   │
│  - positioned below tray icon   │
│  - no titlebar, no dock icon    │
│  - rounded corners, shadow      │
│  - focus/blur → show/hide       │
├─────────────────────────────────┤
│  React App                      │
│  ┌───────────────────────────┐  │
│  │ Tab Bar (top)             │  │
│  │ [Tab1] [Tab2] [+]         │  │
│  ├───────────────────────────┤  │
│  │ xterm.js Terminal         │  │
│  │ (one instance per tab)    │  │
│  └───────────────────────────┘  │
└──────────┬──────────────────────┘
           │ Tauri commands (IPC)
┌──────────▼──────────────────────┐
│  Rust Backend                   │
│  - tauri-plugin-pty             │
│  - spawn PTY per tab            │
│  - pipe stdin/stdout via events │
│  - system tray management       │
│  - activation policy: Accessory │
└─────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Project Scaffolding
1. `create-tauri-app` with React + TS template
2. Add Tailwind CSS
3. Add `tauri-plugin-pty` to Cargo.toml + `tauri.conf.json`
4. Add xterm.js + xterm-addon-fit to frontend deps
5. Verify build compiles and runs

### Phase 2: System Tray + Popover Window
1. **Rust side:**
   - Configure `TrayIconBuilder` with icon + click handler
   - On tray click → calculate position below tray icon, show/hide window
   - Set `activation_policy` to `Accessory` (hide dock icon)
   - Window config: decorations=false, transparent, always_on_top, skip_taskbar
2. **Window behavior:**
   - Click tray icon → toggle window visibility
   - Click outside window → hide (blur event)
   - Fixed width (~600px), configurable height (~400px)

### Phase 3: Single Terminal
1. **Frontend:**
   - Mount xterm.js Terminal in React component
   - Use FitAddon to auto-resize to container
   - Wire `term.onData()` → invoke PTY write command
   - Listen for PTY data events → `term.write()`
2. **Backend:**
   - On frontend ready, spawn PTY with `$SHELL`
   - Pipe PTY stdout → Tauri event to frontend
   - Handle resize events (cols/rows)
3. **Verify:** single working terminal in popover

### Phase 4: Tab Support
1. **State:** `tabs: Tab[]`, `activeTabId: string`
   - `Tab = { id, title, ptyId }`
2. **Tab bar component:**
   - Horizontal tabs at top
   - "+" button to add tab (spawns new PTY)
   - "×" on each tab to close (kills PTY)
   - Click to switch active tab
   - Tab title = last run command or "Terminal N"
3. **Terminal management:**
   - Keep xterm.js instances alive per tab (hidden, not destroyed)
   - Switch active terminal by toggling visibility
   - FitAddon refit on tab switch
4. **Backend:**
   - Track multiple PTY sessions by ID
   - Clean up PTY on tab close

### Phase 5: Theming (System Light/Dark)
1. Detect macOS appearance via `prefers-color-scheme` media query
2. Two xterm.js themes: light + dark
3. Tab bar + chrome styled with Tailwind dark mode (`dark:` variants)
4. Listen for theme change events, update dynamically

### Phase 6: Polish
1. Keyboard shortcuts: `Cmd+T` new tab, `Cmd+W` close tab, `Cmd+1-9` switch tabs
2. Smooth show/hide animation (fade/slide)
3. App icon for menubar (terminal icon, template image for macOS)
4. Proper cleanup on app quit (kill all PTY processes)
5. Handle window resize (drag bottom edge to change height)
6. Popover arrow/notch pointing at tray icon (optional)

## Key Decisions
- **tauri-plugin-pty** over manual portable-pty: less boilerplate, maintained plugin
- **Popover panel**: positioned programmatically below tray icon, not a native NSPopover (Tauri limitation)
- **No session persistence across restarts**: simpler, no serialization needed
- **xterm.js instances kept alive**: switching tabs is instant, no re-render

## File Structure (expected)
```
barterm/
├── src/                    # React frontend
│   ├── App.tsx
│   ├── components/
│   │   ├── TabBar.tsx
│   │   ├── Terminal.tsx
│   │   └── TerminalManager.tsx
│   ├── hooks/
│   │   └── usePty.ts
│   ├── lib/
│   │   └── theme.ts
│   ├── main.tsx
│   └── styles.css
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # app setup, tray, window mgmt
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Unresolved Questions
- tauri-plugin-pty maturity — need to verify it works well w/ Tauri v2 latest; fallback = manual portable-pty integration
- Popover positioning — Tauri's `tray_icon.rect()` available on macOS? need to test
- Window focus behavior — does hiding on blur conflict with right-click context menus in terminal?
