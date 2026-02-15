# Notification Behavior

## macOS Notification Display

**Important:** macOS controls where notifications appear on screen. By default, notifications always show in the **top-right corner of the primary display**. This is a system-level behavior that apps cannot override.

### User Configuration

Users can change notification behavior in **System Settings > Notifications > Barterm**:
- **Banner** (default) - Appears temporarily in top-right
- **Alert** - Appears and stays until dismissed
- **None** - No visual notification

The notification will appear on whichever display macOS considers "primary" based on system settings.

## Supported Notification Mechanisms

Barterm detects terminal notifications through multiple mechanisms:

### 1. BEL Character (standard)

The most common terminal notification. Triggered when a program outputs the BEL control character (`\x07`, `Control-G`, or `\a`).

**Test:** `printf '\a'`

This is the same mechanism that macOS Terminal.app uses for all of its notification features (dock badge, dock bounce, audible/visual bell). According to [Apple's documentation](https://support.apple.com/guide/terminal/trmladvn/mac), Terminal.app's notification system is entirely BEL-based.

### 2. OSC 9 (iTerm2-style notification)

Format: `ESC ] 9 ; <message> BEL`

Originally from iTerm2's Growl integration. Sends a notification with a custom message body.

**Test:** `printf '\e]9;Hello from OSC 9\a'`

### 3. OSC 777 (urxvt-style notification)

Format: `ESC ] 777 ; notify ; <title> ; <body> BEL`

Originated in rxvt-unicode, adopted by other terminals (foot, WezTerm). Supports both a custom title and body.

**Test:** `printf '\e]777;notify;My Title;My Body\a'`

### 4. OSC 99 (kitty-style notification)

Format: `ESC ] 99 ; <params> ; <body> ST`

From the kitty terminal's notification protocol. Supports structured parameters and a body.

**Test:** `printf '\e]99;;Hello from kitty\e\\'`

### Notification data flow

For OSC 9/777/99, the title and body from the escape sequence are used directly in the system notification. For plain BEL, a generic "Terminal Bell" / "Activity in <tab>" message is used.

## Current Implementation

### What Works
- Notification appears when BEL is triggered in a background or inactive tab
- Notification appears when OSC 9/777/99 sequences are received in a background or inactive tab
- OSC notification title/body are forwarded to the system notification
- Tray icon shows red dot badge when there are unread notifications
- Clicking tray icon shows window below the tray (on the screen with the menu bar)
- Window appears on the correct screen when using the tray icon
- Badge clears automatically when window is shown

### Limitations
- Cannot control which screen the notification appears on (macOS system limitation)
- Notification always appears on primary display regardless of active screen
- Programs that don't emit BEL or OSC notification sequences won't trigger notifications (see note on Claude Code below)

## Note on Claude Code

Claude Code does not emit BEL or OSC sequences by default. To get Barterm notifications when Claude Code needs your input, configure Claude Code's [hooks system](https://code.claude.com/docs/en/hooks) to emit a BEL character on notification events.

Add the following to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt|idle_prompt|elicitation_dialog",
        "hooks": [
          {
            "type": "command",
            "command": "printf '\\a' > /dev/tty"
          }
        ]
      }
    ]
  }
}
```

**Important:** The `> /dev/tty` part is required. Hook stdout is captured by Claude Code for JSON parsing, so a bare `printf '\a'` would never reach the terminal. Writing to `/dev/tty` sends the BEL character directly to the controlling terminal (the PTY).

This triggers a BEL on three key events:
- **`permission_prompt`**: Claude needs approval to run a command or make a change
- **`idle_prompt`**: Claude has finished working and is waiting for your next instruction (fires after ~60s of idle time)
- **`elicitation_dialog`**: Claude is showing an interactive dialog asking you to choose between options

The remaining matcher `auth_success` is omitted since it doesn't require user action.

Alternatively, if you use iTerm2, you can run `/terminal-setup` inside Claude Code to enable its built-in iTerm2 notification integration.

## Workaround for Notification Placement

Since we can't control notification placement, the best user experience is:
1. **Notification appears** (on primary display)
2. **User clicks tray icon** (on any display)
3. **Window appears below tray icon** (on the display where they clicked)

This ensures the window appears near where the user is working, even if the notification appeared elsewhere.

## Alternative Approaches

If you need notifications on the active screen, you would need to:
1. Build a custom in-app notification system (not using macOS notifications)
2. Create floating overlay windows (requires additional permissions)
3. Use a third-party notification system

However, these approaches have downsides:
- Custom notifications don't appear when app is hidden
- Overlay windows can be intrusive
- Third-party systems add dependencies

The current implementation using native macOS notifications provides the best balance of functionality and user experience.
