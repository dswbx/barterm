# Changelog

All notable changes to Barterm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tray icon context menu (right-click)
- About window with app information
- Settings UI with macOS-native styling
- Notification toggle in Settings
- "Open Config" menu item to open settings.json
- Generalized settings system with React Context
- Persistent settings storage
- Tray badge indicator for background notifications
- Terminal bell notifications
- Window size persistence
- Multiple tab support
- Keyboard shortcuts (Cmd+T, Cmd+W, Cmd+1-9)
- System theme support (light/dark mode)
- Window positioning below tray icon

### Changed
- Settings now use centralized context system
- Improved notification behavior (only when window hidden or tab inactive)
- Tray menu only shows on right-click (left-click toggles window)

### Fixed
- Settings persistence now works reliably
- Notification settings properly saved to disk
- Window size correctly restored on launch

## [0.1.0] - Initial Release

### Added
- Basic terminal functionality
- Menubar integration
- xterm.js terminal emulator
- PTY backend with Rust
- Tab management
- Basic keyboard shortcuts

---

## Version History

### Unreleased
Current development version with all latest features.

### 0.1.0
Initial release with core terminal functionality.
