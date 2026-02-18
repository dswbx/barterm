import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Switch } from "@base-ui/react/switch";
import { useSettings } from "../contexts/SettingsContext";
import { cn } from "../lib/cn";

type SettingsPage = "general" | "terminal" | "shortcuts" | "about";

interface SettingsProps {
   isDark: boolean;
   onClose: () => void;
}

export function Settings({ isDark, onClose }: SettingsProps) {
   const { settings, updateSetting } = useSettings();
   const [activePage, setActivePage] = useState<SettingsPage>("general");
   const notificationsEnabled = settings.notifications_enabled;

   const pages: { id: SettingsPage; label: string }[] = [
      { id: "general", label: "General" },
      { id: "terminal", label: "Terminal" },
      { id: "shortcuts", label: "Shortcuts" },
      { id: "about", label: "About" },
   ];

   return (
      <div
         className={cn(
            "h-full w-full flex",
            isDark ? "bg-[#1e1e1e]" : "bg-[#ececec]"
         )}
      >
         {/* Sidebar */}
         <div
            className={cn(
               "w-52 flex-shrink-0 flex flex-col border-r gap-2",
               isDark
                  ? "bg-[#2a2a2a] border-[#3a3a3a]"
                  : "bg-[#e3e3e3] border-[#d0d0d0]"
            )}
         >
            <div className="px-4 pt-4 pb-2">
               <button
                  onClick={onClose}
                  className={cn(
                     "flex items-center gap-1.5 text-xs transition-colors",
                     isDark
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                  )}
               >
                  <span>←</span>
                  <span>Back</span>
               </button>
            </div>
            <nav className="px-3 space-y-0.5 flex-1">
               {pages.map((page) => (
                  <button
                     key={page.id}
                     onClick={() => setActivePage(page.id)}
                     className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors",
                        activePage === page.id
                           ? "bg-[#007AFF] text-white font-medium"
                           : isDark
                             ? "text-gray-300 hover:bg-white/5"
                             : "text-gray-700 hover:bg-black/5"
                     )}
                  >
                     {page.label}
                  </button>
               ))}
            </nav>
            <div className="px-4 py-4 flex flex-col items-center gap-1">
               <div
                  className={cn(
                     "text-[11px]",
                     isDark ? "text-gray-600" : "text-gray-400"
                  )}
               >
                  Barterm {import.meta.env.VITE_VERSION}
               </div>
            </div>
         </div>

         {/* Main Content */}
         <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div
               className={cn(
                  "relative px-6 py-2.5 border-b",
                  isDark ? "border-[#3a3a3a]" : "border-[#d0d0d0]"
               )}
            >
               <h1
                  className={cn(
                     "text-base font-semibold",
                     isDark ? "text-white" : "text-black"
                  )}
               >
                  {pages.find((p) => p.id === activePage)?.label}
               </h1>
               <button
                  onClick={() => invoke("close_window")}
                  className={cn(
                     "absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full",
                     "flex items-center justify-center transition-colors text-lg leading-none",
                     isDark
                        ? "hover:bg-[#3d3d3d] text-gray-500 hover:text-gray-300"
                        : "hover:bg-[#d0d0d0] text-gray-400 hover:text-gray-600"
                  )}
                  title="Hide window (Cmd+M)"
               >
                  ×
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
               <div className="max-w-2xl mx-auto">
                  {activePage === "general" && (
                     <GeneralPage
                        isDark={isDark}
                        settings={settings}
                        updateSetting={updateSetting}
                        notificationsEnabled={notificationsEnabled}
                     />
                  )}
                  {activePage === "terminal" && (
                     <TerminalPage
                        isDark={isDark}
                        settings={settings}
                        updateSetting={updateSetting}
                     />
                  )}
                  {activePage === "shortcuts" && (
                     <ShortcutsPage
                        isDark={isDark}
                        settings={settings}
                        updateSetting={updateSetting}
                     />
                  )}
                  {activePage === "about" && <AboutPage isDark={isDark} />}
               </div>
            </div>
         </div>
      </div>
   );
}

// shared types for page props
type UpdateSetting = <
   K extends keyof import("../contexts/SettingsContext").AppSettings,
>(
   key: K,
   value: import("../contexts/SettingsContext").AppSettings[K]
) => Promise<void>;

interface PageProps {
   isDark: boolean;
   settings: import("../contexts/SettingsContext").AppSettings;
   updateSetting: UpdateSetting;
}

// reusable setting row
function SettingRow({
   isDark,
   children,
   last = false,
}: {
   isDark: boolean;
   children: React.ReactNode;
   last?: boolean;
}) {
   return (
      <div
         className={cn(
            "flex items-center justify-between py-3",
            !last && "border-b",
            !last && (isDark ? "border-[#3a3a3a]" : "border-[#d0d0d0]")
         )}
      >
         {children}
      </div>
   );
}

function SettingLabel({
   isDark,
   title,
   description,
}: {
   isDark: boolean;
   title: string;
   description: string;
}) {
   return (
      <div className="flex flex-col flex-1 min-w-0 mr-4 gap-0.5">
         <div
            className={cn(
               "font-medium text-sm",
               isDark ? "text-white" : "text-black"
            )}
         >
            {title}
         </div>
         <div className="text-xs opacity-50 text-white">{description}</div>
      </div>
   );
}

function SettingGroup({
   children,
   isDark,
}: {
   children: React.ReactNode;
   isDark: boolean;
}) {
   return (
      <div
         className={cn(
            "rounded-lg overflow-hidden px-4",
            isDark ? "bg-[#2a2a2a]" : "bg-white"
         )}
      >
         {children}
      </div>
   );
}

function inputClassName(isDark: boolean) {
   return cn(
      "text-[13px] px-2.5 py-1 rounded-md border",
      "focus:outline-none focus:border-[#007AFF]",
      isDark
         ? "bg-[#1e1e1e] border-[#3a3a3a] text-white"
         : "bg-[#ececec] border-[#d0d0d0] text-black"
   );
}

function ToggleSwitch({
   isDark,
   checked,
   onChange,
}: {
   isDark: boolean;
   checked: boolean;
   onChange: (checked: boolean) => void;
}) {
   return (
      <Switch.Root
         checked={checked}
         onCheckedChange={onChange}
         className={cn(
            "relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
         )}
         style={{
            backgroundColor: checked
               ? "#007AFF"
               : isDark
                 ? "#3d3d3d"
                 : "#d0d0d0",
         }}
      >
         <Switch.Thumb
            className="inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform"
            style={{
               transform: checked ? "translateX(20px)" : "translateX(2px)",
            }}
         />
      </Switch.Root>
   );
}

function GeneralPage({
   isDark,
   settings,
   updateSetting,
   notificationsEnabled,
}: PageProps & { notificationsEnabled: boolean }) {
   return (
      <div className="space-y-4">
         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark}>
               <SettingLabel
                  isDark={isDark}
                  title="Appearance"
                  description="Follows system theme"
               />
               <div className="text-[13px] text-gray-500">Auto</div>
            </SettingRow>

            <SettingRow isDark={isDark}>
               <SettingLabel
                  isDark={isDark}
                  title="Window Opacity"
                  description="Adjust the transparency of the window"
               />
               <div className="flex items-center gap-3">
                  <input
                     type="range"
                     min="0.1"
                     max="1"
                     step="0.01"
                     value={settings.window_opacity}
                     onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        invoke("set_window_opacity", { opacity: value });
                        updateSetting("window_opacity", value);
                     }}
                     className="w-24 accent-[#007AFF]"
                  />
                  <span className="text-[13px] tabular-nums w-10 text-right text-gray-500">
                     {Math.round(settings.window_opacity * 100)}%
                  </span>
               </div>
            </SettingRow>

            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Window Size"
                  description="Automatically saved when resized"
               />
            </SettingRow>
         </SettingGroup>

         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Notifications"
                  description="Show terminal bell notifications"
               />
               <ToggleSwitch
                  isDark={isDark}
                  checked={notificationsEnabled}
                  onChange={(checked) =>
                     updateSetting("notifications_enabled", checked)
                  }
               />
            </SettingRow>
         </SettingGroup>
      </div>
   );
}

function TerminalPage({ isDark, settings, updateSetting }: PageProps) {
   return (
      <div className="space-y-4">
         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark}>
               <SettingLabel
                  isDark={isDark}
                  title="Font Family"
                  description="CSS font-family for the terminal"
               />
               <input
                  type="text"
                  value={settings.terminal_theme.font_family}
                  onChange={(e) =>
                     updateSetting("terminal_theme", {
                        ...settings.terminal_theme,
                        font_family: e.target.value,
                     })
                  }
                  className={cn(inputClassName(isDark), "w-52")}
               />
            </SettingRow>

            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Font Size"
                  description="Terminal font size in pixels"
               />
               <input
                  type="number"
                  min="8"
                  max="32"
                  value={settings.terminal_theme.font_size}
                  onChange={(e) => {
                     const value = parseInt(e.target.value);
                     if (!isNaN(value) && value >= 8 && value <= 32) {
                        updateSetting("terminal_theme", {
                           ...settings.terminal_theme,
                           font_size: value,
                        });
                     }
                  }}
                  className={cn(
                     inputClassName(isDark),
                     "w-16 text-right tabular-nums accent-[#007AFF]"
                  )}
               />
            </SettingRow>
         </SettingGroup>

         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark}>
               <SettingLabel
                  isDark={isDark}
                  title="Cursor Blink"
                  description="Whether the terminal cursor blinks"
               />
               <ToggleSwitch
                  isDark={isDark}
                  checked={settings.terminal_theme.cursor_blink}
                  onChange={(checked) =>
                     updateSetting("terminal_theme", {
                        ...settings.terminal_theme,
                        cursor_blink: checked,
                     })
                  }
               />
            </SettingRow>

            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Cursor Style"
                  description="Shape of the terminal cursor"
               />
               <select
                  value={settings.terminal_theme.cursor_style}
                  onChange={(e) =>
                     updateSetting("terminal_theme", {
                        ...settings.terminal_theme,
                        cursor_style: e.target.value as
                           | "block"
                           | "underline"
                           | "bar",
                     })
                  }
                  className={inputClassName(isDark)}
               >
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                  <option value="bar">Bar</option>
               </select>
            </SettingRow>
         </SettingGroup>
      </div>
   );
}

// convert a KeyboardEvent to a Tauri-compatible shortcut string
// e.g. Cmd+Shift+T -> "Shift+Super+T"
function keyEventToShortcut(e: KeyboardEvent): string | null {
   const parts: string[] = [];

   if (e.ctrlKey) parts.push("Control");
   if (e.altKey) parts.push("Alt");
   if (e.shiftKey) parts.push("Shift");
   // metaKey = Cmd on macOS, Win on Windows
   if (e.metaKey) parts.push("Super");

   // ignore modifier-only keypresses
   const ignored = new Set(["Control", "Alt", "Shift", "Meta", "Super"]);
   if (ignored.has(e.key)) return null;

   // map special keys to Tauri key names
   const keyMap: Record<string, string> = {
      " ": "Space",
      ArrowUp: "ArrowUp",
      ArrowDown: "ArrowDown",
      ArrowLeft: "ArrowLeft",
      ArrowRight: "ArrowRight",
      Enter: "Enter",
      Escape: "Escape",
      Backspace: "Backspace",
      Delete: "Delete",
      Tab: "Tab",
      Home: "Home",
      End: "End",
      PageUp: "PageUp",
      PageDown: "PageDown",
   };

   const key = keyMap[e.key] ?? e.key.toUpperCase();
   parts.push(key);

   return parts.join("+");
}

// format a shortcut string for display (e.g. "Shift+Super+T" -> "⇧⌘T")
function formatShortcutDisplay(shortcut: string): string {
   return shortcut
      .split("+")
      .map((part) => {
         switch (part) {
            case "Super": return "⌘";
            case "Control": return "⌃";
            case "Alt": return "⌥";
            case "Shift": return "⇧";
            default: return part;
         }
      })
      .join("");
}

function ShortcutRecorder({
   isDark,
   value,
   onChange,
}: {
   isDark: boolean;
   value: string;
   onChange: (shortcut: string) => void;
}) {
   const [recording, setRecording] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);

   const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
         if (!recording) return;
         e.preventDefault();
         e.stopPropagation();

         const shortcut = keyEventToShortcut(e);
         if (!shortcut) return;

         // require at least one modifier
         if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            setError("include at least one modifier key");
            return;
         }

         setError(null);
         setRecording(false);
         onChange(shortcut);
      },
      [recording, onChange]
   );

   useEffect(() => {
      if (recording) {
         window.addEventListener("keydown", handleKeyDown, true);
         return () => window.removeEventListener("keydown", handleKeyDown, true);
      }
   }, [recording, handleKeyDown]);

   // cancel recording on blur
   const handleBlur = () => {
      setRecording(false);
      setError(null);
   };

   return (
      <div className="flex flex-col items-end gap-1">
         <button
            ref={buttonRef}
            onBlur={handleBlur}
            onClick={() => {
               setRecording(true);
               setError(null);
               buttonRef.current?.focus();
            }}
            className={cn(
               "min-w-[120px] px-3 py-1.5 rounded-md border text-[13px] text-center transition-colors",
               "focus:outline-none",
               recording
                  ? isDark
                     ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                     : "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                  : isDark
                    ? "bg-[#1e1e1e] border-[#3a3a3a] text-white hover:border-[#555]"
                    : "bg-[#ececec] border-[#d0d0d0] text-black hover:border-[#aaa]"
            )}
         >
            {recording ? "recording..." : formatShortcutDisplay(value)}
         </button>
         {error && (
            <span className="text-[11px] text-red-400">{error}</span>
         )}
      </div>
   );
}

function ShortcutsPage({ isDark, settings, updateSetting }: PageProps) {
   const [applyError, setApplyError] = useState<string | null>(null);

   const handleShortcutChange = async (shortcut: string) => {
      setApplyError(null);
      try {
         await invoke<void>("set_toggle_shortcut", { shortcut });
         await updateSetting("shortcuts", {
            ...settings.shortcuts,
            toggle_window: shortcut,
         });
      } catch (e) {
         setApplyError(String(e));
      }
   };

   return (
      <div className="space-y-4">
         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Toggle Window"
                  description="Show or hide the Barterm window"
               />
               <div className="flex flex-col items-end gap-1">
                  <ShortcutRecorder
                     isDark={isDark}
                     value={settings.shortcuts.toggle_window}
                     onChange={handleShortcutChange}
                  />
                  {applyError && (
                     <span className="text-[11px] text-red-400 max-w-[180px] text-right">
                        {applyError}
                     </span>
                  )}
               </div>
            </SettingRow>
         </SettingGroup>
         <p className={cn("text-[11px] px-1", isDark ? "text-gray-500" : "text-gray-400")}>
            click the shortcut to record a new one
         </p>
      </div>
   );
}

function AboutPage({ isDark }: { isDark: boolean }) {
   return (
      <div className="space-y-4">
         <SettingGroup isDark={isDark}>
            <SettingRow isDark={isDark} last>
               <SettingLabel
                  isDark={isDark}
                  title="Barterm"
                  description={`Version ${import.meta.env.VITE_VERSION}`}
               />
            </SettingRow>
         </SettingGroup>
      </div>
   );
}
