# Troubleshooting

## Common Issues

### Terminal Not Responding

**Symptoms**: Terminal doesn't accept input or show output

**Solutions**:
1. Check if PTY process is running
2. Try creating a new tab (Cmd+T)
3. Restart the application
4. Check terminal output for errors: `npm run tauri:dev`

### Settings Not Persisting

**Symptoms**: Settings reset after restarting the app

**Solutions**:
1. Check settings file exists:
   ```bash
   cat ~/Library/Application\ Support/com.barterm.app/settings.json
   ```
2. Verify file permissions (should be writable)
3. Check console for errors when changing settings
4. Try manually editing the settings file

### Notifications Not Working

**Symptoms**: No notifications when terminal bell rings

**Solutions**:
1. Check notification permissions:
   - System Settings → Notifications → Barterm
   - Ensure "Allow Notifications" is enabled
2. Verify setting is enabled:
   - Right-click tray → Settings → Notifications toggle
3. Test bell character: `echo -e '\a'`
4. Check "Do Not Disturb" is not enabled

### Window Not Showing

**Symptoms**: Click tray icon but window doesn't appear

**Solutions**:
1. Check if window is off-screen (try different display)
2. Quit and restart the app
3. Delete settings file to reset:
   ```bash
   rm ~/Library/Application\ Support/com.barterm.app/settings.json
   ```
4. Check for errors in console

### Tray Icon Not Appearing

**Symptoms**: No tray icon in menubar

**Solutions**:
1. Check menubar isn't full (hide other icons)
2. Restart the app
3. Check if app is actually running: `ps aux | grep barterm`
4. Reinstall the application

### Window Positioning Issues

**Symptoms**: Window appears in wrong location

**Solutions**:
1. Window should appear below tray icon
2. Check multiple monitor setup
3. Try hiding and showing window again
4. Reset window size by deleting settings

### Keyboard Shortcuts Not Working

**Symptoms**: Cmd+T, Cmd+W, etc. don't work

**Solutions**:
1. Ensure terminal has focus (click in terminal area)
2. Check for conflicting system shortcuts
3. Try clicking in the terminal before using shortcuts
4. Restart the application

### High CPU Usage

**Symptoms**: App uses excessive CPU

**Solutions**:
1. Check for runaway processes in terminals
2. Reduce number of open tabs
3. Check for infinite loops in running programs
4. Restart the application

### Theme Issues

**Symptoms**: Wrong colors or theme not matching system

**Solutions**:
1. Theme follows system automatically
2. Change system theme: System Settings → Appearance
3. Restart app after changing system theme
4. Check terminal color scheme in running programs

## Development Issues

### Build Failures

**Rust compilation errors**:
```bash
cd src-tauri
cargo clean
cargo build
```

**Node/npm errors**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working

1. Stop dev server (Ctrl+C)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart: `npm run tauri:dev`

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Logs and Debugging

### View Application Logs

**Development mode**:
- Frontend logs: Browser DevTools console
- Backend logs: Terminal where `npm run tauri:dev` is running

**Production mode**:
- macOS Console app → search for "barterm"
- Terminal: `log show --predicate 'process == "barterm"' --last 1h`

### Debug Mode

Run with verbose logging:
```bash
RUST_LOG=debug npm run tauri:dev
```

### Check Settings File

```bash
# View settings
cat ~/Library/Application\ Support/com.barterm.app/settings.json

# Pretty print
cat ~/Library/Application\ Support/com.barterm.app/settings.json | jq .

# Edit manually
open ~/Library/Application\ Support/com.barterm.app/settings.json
```

### Reset Application

**Complete reset**:
```bash
# Remove settings
rm -rf ~/Library/Application\ Support/com.barterm.app/

# Restart app
```

## Performance Issues

### Slow Terminal Rendering

1. Reduce terminal buffer size
2. Limit output from commands (use `head`, `tail`, etc.)
3. Close unused tabs
4. Check for processes generating excessive output

### Memory Leaks

1. Monitor memory usage: Activity Monitor
2. Close and reopen tabs periodically
3. Restart application if memory usage is high
4. Report issue with steps to reproduce

## Getting Help

### Before Reporting Issues

1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Try resetting settings (see above)
4. Collect relevant logs

### Reporting Bugs

Include:
- macOS version
- Barterm version
- Steps to reproduce
- Expected vs actual behavior
- Console logs (if applicable)
- Screenshots (if applicable)

### Feature Requests

- Check if feature already exists
- Describe use case clearly
- Explain why it would be useful
- Consider submitting a PR

## Emergency Recovery

If the app is completely broken:

```bash
# 1. Kill the app
pkill -9 barterm

# 2. Remove all data
rm -rf ~/Library/Application\ Support/com.barterm.app/

# 3. Reinstall
# Delete app from Applications
# Reinstall from DMG

# 4. Restart
# Launch app fresh
```

## Known Limitations

- Maximum 9 tabs (Cmd+1-9 limitation)
- macOS only (no Windows/Linux support yet)
- No tab reordering (yet)
- No split panes (yet)
- No custom themes (follows system theme)

## Still Having Issues?

Open an issue on GitHub with:
- Detailed description
- Steps to reproduce
- System information
- Logs and screenshots
