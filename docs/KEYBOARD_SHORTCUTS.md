# Keyboard Shortcuts

## Tab Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+T` | New Tab | Creates a new terminal tab |
| `Cmd+W` | Close Tab | Closes current tab (opens a fresh tab if it was the last one) |
| `Cmd+Shift+W` | Close All & Hide | Closes all tabs and hides barterm |
| `Cmd+1` | Switch to Tab 1 | Switches to the first tab |
| `Cmd+2` | Switch to Tab 2 | Switches to the second tab |
| `Cmd+3` | Switch to Tab 3 | Switches to the third tab |
| `Cmd+4` | Switch to Tab 4 | Switches to the fourth tab |
| `Cmd+5` | Switch to Tab 5 | Switches to the fifth tab |
| `Cmd+6` | Switch to Tab 6 | Switches to the sixth tab |
| `Cmd+7` | Switch to Tab 7 | Switches to the seventh tab |
| `Cmd+8` | Switch to Tab 8 | Switches to the eighth tab |
| `Cmd+9` | Switch to Tab 9 | Switches to the ninth tab |

## Window Management

| Shortcut / Action | Method | Description |
|-------------------|--------|-------------|
| `Cmd+,` | Keyboard | Opens settings (or returns to terminal if settings are open) |
| `Cmd+M` | Keyboard | Hides barterm (also closes settings view if open) |
| Show/Hide Window | Left-click tray icon | Toggles window visibility |
| Context Menu | Right-click tray icon | Opens tray menu |

## Terminal Shortcuts

All standard terminal shortcuts work within the terminal:

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Interrupt (SIGINT) |
| `Ctrl+D` | End of file (EOF) |
| `Ctrl+Z` | Suspend (SIGTSTP) |
| `Ctrl+L` | Clear screen |
| `Ctrl+A` | Move to start of line |
| `Ctrl+E` | Move to end of line |
| `Ctrl+K` | Kill to end of line |
| `Ctrl+U` | Kill to start of line |
| `Ctrl+W` | Kill previous word |
| `Ctrl+R` | Reverse search history |

## Settings View

When in Settings view:

| Action | Method |
|--------|--------|
| Back to Terminal | `Cmd+,` or click "← Terminal" button |
| Close Window | Click × button in header |

## Tray Menu

Right-click the tray icon to access:

- **About Barterm** - Shows app information
- **Settings** - Opens settings interface
- **Open Config** - Opens settings.json in default editor
- **Quit** - Exits the application

## Tips

- **Tab Navigation**: Cmd+1 through Cmd+9 allows quick switching between up to 9 tabs
- **Quick Close**: Use Cmd+W to close the current tab, or Cmd+Shift+W to close all tabs and hide
- **Quick Hide**: Use Cmd+M to quickly hide barterm without closing any tabs
- **Window Toggle**: Left-click the tray icon for quick access to your terminal
- **Bell Notifications**: Terminal bell (`echo -e '\a'`) triggers notifications when window is hidden
