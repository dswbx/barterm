# Notification Behavior

## macOS Notification Display

**Important:** macOS controls where notifications appear on screen. By default, notifications always show in the **top-right corner of the primary display**. This is a system-level behavior that apps cannot override.

### User Configuration

Users can change notification behavior in **System Settings > Notifications > Barterm**:
- **Banner** (default) - Appears temporarily in top-right
- **Alert** - Appears and stays until dismissed
- **None** - No visual notification

The notification will appear on whichever display macOS considers "primary" based on system settings.

## Current Implementation

### What Works
✅ Notification appears when bell is triggered in background or inactive tab
✅ Tray icon shows red dot badge when there are unread bells
✅ Clicking tray icon shows window below the tray (on the screen with the menu bar)
✅ Window appears on the correct screen when using the tray icon
✅ Badge clears automatically when window is shown

### Limitations
❌ Cannot control which screen the notification appears on (macOS system limitation)
❌ Notification always appears on primary display regardless of active screen

## Workaround

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
