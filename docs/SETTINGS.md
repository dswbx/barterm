# Settings System

This app uses a centralized settings system with a React Context and Rust backend.

## Architecture

### Backend (Rust)
- **File**: `src-tauri/src/lib.rs`
- **Commands**:
  - `get_settings()` - Returns all settings as JSON
  - `set_setting(key, value)` - Sets a single setting and saves
  - `get_setting(key)` - Gets a single setting value
  - `get_config_path()` - Returns the path to settings.json
  - `open_config()` - Opens settings.json in default editor

### Frontend (React)
- **Context**: `src/contexts/SettingsContext.tsx`
- **Hook**: `useSettings()`
- **Interface**: `AppSettings` - TypeScript interface defining all settings

## Adding a New Setting

### 1. Update the TypeScript Interface

Edit `src/contexts/SettingsContext.tsx`:

```typescript
export interface AppSettings {
   notifications_enabled: boolean;
   window_width?: number;
   window_height?: number;
   // Add your new setting here
   my_new_setting: string;
}

const defaultSettings: AppSettings = {
   notifications_enabled: true,
   // Add default value
   my_new_setting: "default_value",
};
```

### 2. Use the Setting in Your Component

```typescript
import { useSettings } from "../contexts/SettingsContext";

function MyComponent() {
   const { settings, updateSetting } = useSettings();
   
   // Read a setting
   const myValue = settings.my_new_setting;
   
   // Update a setting
   const handleChange = (newValue: string) => {
      updateSetting("my_new_setting", newValue);
   };
   
   return (
      <div>
         <input 
            value={myValue} 
            onChange={(e) => handleChange(e.target.value)} 
         />
      </div>
   );
}
```

## Example: Adding a Theme Setting

### 1. Update AppSettings interface:

```typescript
export interface AppSettings {
   notifications_enabled: boolean;
   theme: "light" | "dark" | "auto";
}

const defaultSettings: AppSettings = {
   notifications_enabled: true,
   theme: "auto",
};
```

### 2. Use in component:

```typescript
function Settings() {
   const { settings, updateSetting } = useSettings();
   
   return (
      <select 
         value={settings.theme}
         onChange={(e) => updateSetting("theme", e.target.value)}
      >
         <option value="auto">Auto</option>
         <option value="light">Light</option>
         <option value="dark">Dark</option>
      </select>
   );
}
```

## Features

- ✅ Type-safe settings with TypeScript
- ✅ Automatic persistence to disk
- ✅ Centralized state management
- ✅ No boilerplate - just add to interface and use
- ✅ Settings automatically loaded on app start
- ✅ Immediate UI updates when settings change
- ✅ Error handling with automatic rollback

## Settings File Location

- **macOS**: `~/Library/Application Support/com.barterm.app/settings.json`
- **Windows**: `%APPDATA%\com.barterm.app\settings.json`
- **Linux**: `~/.local/share/com.barterm.app/settings.json`

You can open the settings file from the tray menu: **Right-click tray icon → Open Config**
