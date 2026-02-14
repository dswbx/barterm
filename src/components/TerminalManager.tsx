import { useState, useRef, useCallback, useEffect, createRef } from "react";
import { Terminal, TerminalHandle } from "./Terminal";
import { TabBar } from "./TabBar";
import { usePty } from "../hooks/usePty";
import {
   lightTheme,
   darkTheme,
   getSystemTheme,
   watchSystemTheme,
} from "../lib/theme";
import { invoke } from "@tauri-apps/api/core";
import {
   isPermissionGranted,
   requestPermission,
   sendNotification,
} from "@tauri-apps/plugin-notification";
import { listen } from "@tauri-apps/api/event";
import { Switch } from "@base-ui/react/switch";
import { useSettings } from "../contexts/SettingsContext";

interface Tab {
   id: number;
   title: string;
   ptyId: number | null;
   hasBell: boolean;
}

export function TerminalManager() {
   const { settings, isLoaded: settingsLoaded } = useSettings();
   const [tabs, setTabs] = useState<Tab[]>([
      { id: 1, title: "Terminal 1", ptyId: null, hasBell: false },
   ]);
   const [activeTabId, setActiveTabId] = useState(1);
   const [nextTabId, setNextTabId] = useState(2);
   const [isDark, setIsDark] = useState(getSystemTheme() === "dark");
   const [showSettings, setShowSettings] = useState(false);
   const terminalRefs = useRef<Map<number, React.RefObject<TerminalHandle>>>(
      new Map()
   );

   const notificationsEnabled = settings.notifications_enabled;

   // apply window opacity when settings are loaded
   useEffect(() => {
      if (!settingsLoaded) return;
      invoke("set_window_opacity", { opacity: settings.window_opacity });
   }, [settingsLoaded]);

   // request notification permission after settings are loaded
   useEffect(() => {
      if (!settingsLoaded) return;

      const requestNotificationPermission = async () => {
         if (notificationsEnabled) {
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
               const permission = await requestPermission();
               permissionGranted = permission === "granted";
            }
         }
      };
      requestNotificationPermission();
   }, [notificationsEnabled, settingsLoaded]);

   // listen for show-settings event from backend
   useEffect(() => {
      const unlisten = listen("show-settings", () => {
         setShowSettings(true);
      });

      return () => {
         unlisten.then((fn) => fn());
      };
   }, []);

   const handleNewTab = useCallback(() => {
      const newTab: Tab = {
         id: nextTabId,
         title: `Terminal ${nextTabId}`,
         ptyId: null,
         hasBell: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(nextTabId);
      setNextTabId((prev) => prev + 1);
   }, [nextTabId]);

   const handleTabClose = useCallback(
      (tabId: number) => {
         setTabs((prev) => {
            const newTabs = prev.filter((t) => t.id !== tabId);
            if (newTabs.length === 0) {
               // always keep at least one tab
               return prev;
            }
            // if closing active tab, switch to another
            if (tabId === activeTabId) {
               const index = prev.findIndex((t) => t.id === tabId);
               const newActiveTab = newTabs[Math.max(0, index - 1)];
               setActiveTabId(newActiveTab.id);
            }

            // clean up the ref for the closed tab
            terminalRefs.current.delete(tabId);

            return newTabs;
         });
      },
      [activeTabId]
   );

   const handleTabClick = useCallback((tabId: number) => {
      setActiveTabId(tabId);
      // clear bell state when tab is clicked
      setTabs((prev) =>
         prev.map((tab) =>
            tab.id === tabId ? { ...tab, hasBell: false } : tab
         )
      );
      // focus the terminal after switching tabs
      setTimeout(() => {
         terminalRefs.current.get(tabId)?.current?.focus();
      }, 0);

      // clear tray badge if no tabs have bells
      setTimeout(() => {
         setTabs((currentTabs) => {
            const hasAnyBells = currentTabs.some((t) => t.hasBell);
            if (!hasAnyBells) {
               invoke("set_tray_badge", { hasUnread: false });
            }
            return currentTabs;
         });
      }, 100);
   }, []);

   const handleBell = useCallback(
      async (tabId: number) => {
         const tab = tabs.find((t) => t.id === tabId);
         if (!tab) return;

         // check if window is visible
         const isVisible = await invoke<boolean>("is_window_visible");

         // show notification if window is hidden OR if tab is not active
         const shouldNotify = !isVisible || tabId !== activeTabId;

         if (shouldNotify) {
            // set bell state (only if tab is not active)
            if (tabId !== activeTabId) {
               setTabs((prev) =>
                  prev.map((t) =>
                     t.id === tabId ? { ...t, hasBell: true } : t
                  )
               );
            }

            // send notification only if enabled
            if (notificationsEnabled) {
               const permissionGranted = await isPermissionGranted();
               if (permissionGranted) {
                  const notificationBody = isVisible
                     ? `Activity in ${tab.title}`
                     : "Terminal activity";
                  sendNotification({
                     title: "Terminal Bell",
                     body: notificationBody,
                  });
               }
            }

            // update tray icon badge
            await invoke("set_tray_badge", { hasUnread: true });
         }
      },
      [tabs, activeTabId, notificationsEnabled]
   );

   const handleCloseWindow = useCallback(() => {
      invoke("close_window");
   }, []);

   // watch for system theme changes
   useEffect(() => {
      const unwatch = watchSystemTheme((theme) => {
         const dark = theme === "dark";
         setIsDark(dark);

         // update all terminal themes
         terminalRefs.current.forEach((ref) => {
            ref.current?.setTheme(dark ? darkTheme : lightTheme);
         });
      });

      return unwatch;
   }, []);

   // clear tray badge when window becomes visible
   useEffect(() => {
      const handleVisibilityChange = async () => {
         const isVisible = await invoke<boolean>("is_window_visible");
         if (isVisible) {
            // clear tray badge when window is shown
            await invoke("set_tray_badge", { hasUnread: false });
         }
      };

      // check on mount and when window focus changes
      handleVisibilityChange();

      // listen for window focus
      window.addEventListener("focus", handleVisibilityChange);

      return () => {
         window.removeEventListener("focus", handleVisibilityChange);
      };
   }, []);

   // keyboard shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         // Cmd+T - new tab
         if (e.metaKey && e.key === "t") {
            e.preventDefault();
            handleNewTab();
         }
         // Cmd+W - close tab or window
         else if (e.metaKey && e.key === "w") {
            e.preventDefault();
            if (tabs.length > 1) {
               handleTabClose(activeTabId);
            } else {
               handleCloseWindow();
            }
         }
         // Cmd+1-9 - switch to tab
         else if (e.metaKey && e.key >= "1" && e.key <= "9") {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            if (index < tabs.length) {
               setActiveTabId(tabs[index].id);
            }
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [tabs, activeTabId, handleNewTab, handleTabClose, handleCloseWindow]);

   return (
      <div
         className={`h-screen w-full flex flex-col ${isDark ? "bg-gray-900" : "bg-gray-100"} fixed overflow-hidden overscroll-none rounded-xl`}
      >
         {showSettings ? (
            <Settings isDark={isDark} onClose={() => setShowSettings(false)} />
         ) : (
            <>
               {tabs.length > 1 && (
                  <TabBar
                     tabs={tabs}
                     activeTabId={activeTabId}
                     onTabClick={handleTabClick}
                     onTabClose={handleTabClose}
                     onNewTab={handleNewTab}
                  >
                     {/* Close button */}
                     <div className="absolute top-0 right-1 z-50 h-full flex items-center justify-center py-1">
                        <button
                           onClick={handleCloseWindow}
                           className="px-2 h-full text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-sm leading-none"
                           title="Close window (Cmd+W)"
                        >
                           ×
                        </button>
                     </div>
                  </TabBar>
               )}
               <div className="flex-1 relative pb-1">
                  {tabs.map((tab) => {
                     if (!terminalRefs.current.has(tab.id)) {
                        terminalRefs.current.set(
                           tab.id,
                           createRef<TerminalHandle>()
                        );
                     }
                     return (
                        <TerminalTab
                           key={tab.id}
                           tabId={tab.id}
                           isActive={tab.id === activeTabId}
                           theme={isDark ? darkTheme : lightTheme}
                           terminalRef={terminalRefs.current.get(tab.id)!}
                           onBell={() => handleBell(tab.id)}
                        />
                     );
                  })}
               </div>
            </>
         )}
      </div>
   );
}

interface TerminalTabProps {
   tabId: number;
   isActive: boolean;
   theme: any;
   terminalRef: React.RefObject<TerminalHandle>;
   onBell: () => void;
}

function TerminalTab({
   tabId,
   isActive,
   theme,
   terminalRef,
   onBell,
}: TerminalTabProps) {
   const { write, resize } = usePty({
      tabId,
      cols: 80,
      rows: 24,
      onData: (data) => {
         terminalRef.current?.write(data);
      },
   });

   const handleData = (data: string) => {
      write(data);
   };

   const handleResize = (cols: number, rows: number) => {
      resize(cols, rows);
   };

   return (
      <div
         className={`absolute inset-0 ${isActive ? "block" : "hidden"} pb-1`}
         style={{ backgroundColor: theme.background }}
      >
         <Terminal
            ref={terminalRef}
            onData={handleData}
            onResize={handleResize}
            onBell={onBell}
            theme={theme}
         />
      </div>
   );
}

interface SettingsProps {
   isDark: boolean;
   onClose: () => void;
}

function Settings({ isDark, onClose }: SettingsProps) {
   const { settings, updateSetting } = useSettings();
   const notificationsEnabled = settings.notifications_enabled;
   const handleCloseWindow = () => {
      invoke("close_window");
   };

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
                  <div
                     className={`px-3 py-2 rounded-md text-sm font-medium ${isDark ? "bg-[#3d3d3d] text-white" : "bg-white text-black"}`}
                  >
                     General
                  </div>
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
                  General
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
                  {/* Theme Setting */}
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

                  {/* Window Opacity Setting */}
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

                  {/* Notifications Setting */}
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

                  {/* Window Size Setting */}
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

                  {/* About Section */}
                  <div className="pt-6">
                     <div
                        className={`text-xs font-medium uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                     >
                        About
                     </div>
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
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
