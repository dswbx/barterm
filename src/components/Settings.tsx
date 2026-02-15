import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Switch } from "@base-ui/react/switch";
import { useSettings } from "../contexts/SettingsContext";

type SettingsPage = "general" | "terminal" | "about";

interface SettingsProps {
   isDark: boolean;
   onClose: () => void;
}

export function Settings({ isDark, onClose }: SettingsProps) {
   const { settings, updateSetting } = useSettings();
   const [activePage, setActivePage] = useState<SettingsPage>("general");
   const notificationsEnabled = settings.notifications_enabled;
   const handleCloseWindow = () => {
      invoke("close_window");
   };

   const pages: { id: SettingsPage; label: string }[] = [
      { id: "general", label: "General" },
      { id: "terminal", label: "Terminal" },
      { id: "about", label: "About" },
   ];

   return (
      <div
         className={`h-full w-full flex ${isDark ? "bg-[#1e1e1e]" : "bg-[#ececec]"}`}
      >
         {/* Sidebar */}
         <div
            className={`w-48 flex-shrink-0 ${isDark ? "bg-[#2d2d2d]" : "bg-[#e3e3e3]"} border-r ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="p-4">
               <button
                  onClick={onClose}
                  className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"} transition-colors mb-6`}
               >
                  <span>←</span>
                  <span>Terminal</span>
               </button>
               <nav className="space-y-1">
                  {pages.map((page) => (
                     <button
                        key={page.id}
                        onClick={() => setActivePage(page.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                           activePage === page.id
                              ? isDark
                                 ? "bg-[#3d3d3d] text-white"
                                 : "bg-white text-black"
                              : isDark
                                ? "text-gray-400 hover:text-white hover:bg-[#3d3d3d]/50"
                                : "text-gray-600 hover:text-black hover:bg-white/50"
                        }`}
                     >
                        {page.label}
                     </button>
                  ))}
               </nav>
            </div>
         </div>

         {/* Main Content */}
         <div className="flex-1 flex flex-col">
            {/* Header */}
            <div
               className={`px-6 py-4 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"} flex items-center justify-between`}
            >
               <h1
                  className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}
               >
                  {pages.find((p) => p.id === activePage)?.label}
               </h1>
               <button
                  onClick={handleCloseWindow}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? "hover:bg-[#3d3d3d] text-gray-400 hover:text-white" : "hover:bg-[#d0d0d0] text-gray-600 hover:text-black"} transition-colors text-lg leading-none`}
                  title="Close window"
               >
                  ×
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
               <div className="max-w-3xl space-y-6">
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
                  {activePage === "about" && <AboutPage isDark={isDark} />}
               </div>
            </div>
         </div>
      </div>
   );
}

// shared types for page props
type UpdateSetting = <K extends keyof import("../contexts/SettingsContext").AppSettings>(
   key: K,
   value: import("../contexts/SettingsContext").AppSettings[K]
) => Promise<void>;

interface PageProps {
   isDark: boolean;
   settings: import("../contexts/SettingsContext").AppSettings;
   updateSetting: UpdateSetting;
}

function GeneralPage({
   isDark,
   settings,
   updateSetting,
   notificationsEnabled,
}: PageProps & { notificationsEnabled: boolean }) {
   return (
      <>
         {/* Appearance */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Appearance
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Follows system theme
               </div>
            </div>
            <div
               className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
               Auto
            </div>
         </div>

         {/* Window Opacity */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Window Opacity
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Adjust the transparency of the window
               </div>
            </div>
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
               <span
                  className={`text-sm tabular-nums w-10 text-right ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  {Math.round(settings.window_opacity * 100)}%
               </span>
            </div>
         </div>

         {/* Notifications */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Notifications
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Show terminal bell notifications
               </div>
            </div>
            <Switch.Root
               checked={notificationsEnabled}
               onCheckedChange={(checked) =>
                  updateSetting("notifications_enabled", checked)
               }
               className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
               style={{
                  backgroundColor: notificationsEnabled
                     ? "#007AFF"
                     : isDark
                       ? "#3d3d3d"
                       : "#d0d0d0",
               }}
            >
               <Switch.Thumb
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                  style={{
                     transform: notificationsEnabled
                        ? "translateX(22px)"
                        : "translateX(2px)",
                  }}
               />
            </Switch.Root>
         </div>

         {/* Window Size */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Window Size
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Automatically saved when resized
               </div>
            </div>
         </div>
      </>
   );
}

function TerminalPage({ isDark, settings, updateSetting }: PageProps) {
   return (
      <>
         {/* Font Family */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Font Family
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  CSS font-family for the terminal
               </div>
            </div>
            <input
               type="text"
               value={settings.terminal_theme.font_family}
               onChange={(e) =>
                  updateSetting("terminal_theme", {
                     ...settings.terminal_theme,
                     font_family: e.target.value,
                  })
               }
               className={`w-56 text-sm px-2 py-1 rounded border ${
                  isDark
                     ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                     : "bg-white border-[#d0d0d0] text-black"
               } focus:outline-none focus:border-[#007AFF]`}
            />
         </div>

         {/* Font Size */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Font Size
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Terminal font size in pixels
               </div>
            </div>
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
               className={`w-16 text-sm px-2 py-1 rounded border text-right tabular-nums ${
                  isDark
                     ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                     : "bg-white border-[#d0d0d0] text-black"
               } focus:outline-none focus:border-[#007AFF]`}
            />
         </div>

         {/* Cursor Blink */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Cursor Blink
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Whether the terminal cursor blinks
               </div>
            </div>
            <Switch.Root
               checked={settings.terminal_theme.cursor_blink}
               onCheckedChange={(checked) =>
                  updateSetting("terminal_theme", {
                     ...settings.terminal_theme,
                     cursor_blink: checked,
                  })
               }
               className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
               style={{
                  backgroundColor: settings.terminal_theme.cursor_blink
                     ? "#007AFF"
                     : isDark
                       ? "#3d3d3d"
                       : "#d0d0d0",
               }}
            >
               <Switch.Thumb
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                  style={{
                     transform: settings.terminal_theme.cursor_blink
                        ? "translateX(22px)"
                        : "translateX(2px)",
                  }}
               />
            </Switch.Root>
         </div>

         {/* Cursor Style */}
         <div
            className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
         >
            <div className="flex-1">
               <div
                  className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
               >
                  Cursor Style
               </div>
               <div
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
               >
                  Shape of the terminal cursor
               </div>
            </div>
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
               className={`text-sm px-2 py-1 rounded border ${
                  isDark
                     ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                     : "bg-white border-[#d0d0d0] text-black"
               } focus:outline-none focus:border-[#007AFF]`}
            >
               <option value="block">Block</option>
               <option value="underline">Underline</option>
               <option value="bar">Bar</option>
            </select>
         </div>
      </>
   );
}

function AboutPage({ isDark }: { isDark: boolean }) {
   return (
      <div
         className={`flex items-start justify-between py-3 border-b ${isDark ? "border-[#3d3d3d]" : "border-[#d0d0d0]"}`}
      >
         <div className="flex-1">
            <div
               className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}
            >
               Barterm
            </div>
            <div
               className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
               Version 0.1.0
            </div>
         </div>
      </div>
   );
}
