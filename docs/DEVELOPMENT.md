# Development Guide

## Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- macOS (for development)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd barterm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

## Development Commands

```bash
# Start dev server with hot reload
npm run tauri:dev

# Build for production
npm run tauri:build

# Run frontend only (without Tauri)
npm run dev

# Build frontend only
npm run build

# Type check
npx tsc --noEmit
```

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed structure.

## Adding Features

### Adding a New Setting

See [SETTINGS.md](./SETTINGS.md) for the complete guide.

Quick example:
```typescript
// 1. Add to AppSettings interface
export interface AppSettings {
   my_setting: string;
}

// 2. Use in component
const { settings, updateSetting } = useSettings();
updateSetting("my_setting", "value");
```

### Adding a New Tauri Command

1. **Add command in Rust** (`src-tauri/src/lib.rs`):
```rust
#[tauri::command]
fn my_command(app: AppHandle, param: String) -> String {
    // implementation
    format!("Result: {}", param)
}
```

2. **Register command**:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    my_command
])
```

3. **Call from frontend**:
```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<string>("my_command", { param: "value" });
```

### Adding a New Menu Item

1. **Create menu item** (`src-tauri/src/lib.rs`):
```rust
let my_item = MenuItemBuilder::with_id("my_id", "My Label").build(app)?;

let menu = MenuBuilder::new(app)
    .item(&my_item)
    // ... other items
    .build()?;
```

2. **Handle menu event**:
```rust
.on_menu_event(|app, event| match event.id().as_ref() {
    "my_id" => {
        // handle click
    }
    // ... other handlers
})
```

## Styling Guidelines

### Tailwind Classes
- Use Tailwind utility classes for styling
- Follow existing patterns for consistency
- Dark mode: Use conditional classes based on `isDark` prop

### macOS Native Look
- Use native colors: `#ececec`, `#e3e3e3`, `#2d2d2d`, `#3d3d3d`
- Follow macOS design patterns (see Settings UI)
- Use system fonts: `-apple-system, BlinkMacSystemFont`

## Testing

### Manual Testing Checklist

- [ ] Terminal input/output works
- [ ] Multiple tabs work correctly
- [ ] Tab switching (Cmd+1-9)
- [ ] New tab (Cmd+T)
- [ ] Close tab (Cmd+W)
- [ ] Window positioning below tray
- [ ] Window size persistence
- [ ] Settings persistence
- [ ] Notifications (when enabled)
- [ ] Tray badge on bell
- [ ] Context menu items
- [ ] About window
- [ ] Settings UI
- [ ] Open Config
- [ ] Theme switching (light/dark)

### Testing Notifications

1. Enable notifications in Settings
2. In terminal, run: `echo -e '\a'` (bell character)
3. Switch to another app or hide window
4. Verify notification appears
5. Verify tray badge shows

### Testing Settings Persistence

1. Change a setting (e.g., disable notifications)
2. Quit app completely
3. Relaunch app
4. Verify setting is persisted
5. Check `~/Library/Application Support/com.barterm.app/settings.json`

## Debugging

### Frontend Debugging

1. **Open DevTools**: The app runs in development mode with DevTools available
2. **Console logs**: Use `console.log()` for debugging
3. **React DevTools**: Install browser extension for React debugging

### Backend Debugging

1. **Rust logs**: Use `println!()` or `dbg!()` macros
2. **View logs**: Check terminal output where `npm run tauri:dev` is running
3. **Rust errors**: Compilation errors show in terminal

### Common Issues

**Issue**: Terminal not showing output
- Check PTY process is spawning correctly
- Verify data flow in usePty hook
- Check terminal ref is set correctly

**Issue**: Settings not persisting
- Verify `set_setting` command is being called
- Check settings.json file exists and is writable
- Ensure store.save() is called in Rust

**Issue**: Window positioning incorrect
- Check tray icon rect is available
- Verify window size is correct
- Test on different screen configurations

**Issue**: Notifications not working
- Check notification permissions granted
- Verify `notifications_enabled` setting is true
- Test bell character: `echo -e '\a'`

## Building for Production

```bash
# Build optimized production bundle
npm run tauri:build
```

Output locations:
- **DMG**: `src-tauri/target/release/bundle/dmg/`
- **App**: `src-tauri/target/release/bundle/macos/`

## Code Style

### TypeScript
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript types, avoid `any`
- Follow existing naming conventions

### Rust
- Follow Rust standard style (rustfmt)
- Use `snake_case` for functions
- Handle errors appropriately
- Document public functions

### Comments
- Start comments with lowercase (per user rules)
- Explain "why" not "what"
- Keep comments concise

## Performance Tips

- Minimize re-renders with `useCallback` and `useMemo`
- Debounce expensive operations (e.g., resize)
- Use refs for imperative operations
- Lazy load heavy components

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit pull request

## Resources

- [Tauri Documentation](https://tauri.app/)
- [xterm.js Documentation](https://xtermjs.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
