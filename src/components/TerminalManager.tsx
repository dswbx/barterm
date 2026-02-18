import { useState, useRef, useCallback, useEffect, createRef } from "react";
import { TerminalHandle } from "./Terminal";
import { TabBar } from "./TabBar";
import { TerminalTab } from "./TerminalTab";
import { Settings } from "./Settings";
import { UpdateBadge } from "./UpdateBadge";
import { lightTheme, darkTheme, getSystemTheme, watchSystemTheme } from "../lib/theme";
import { invoke } from "@tauri-apps/api/core";
import {
   isPermissionGranted,
   requestPermission,
   sendNotification,
} from "@tauri-apps/plugin-notification";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { listen } from "@tauri-apps/api/event";
import { useSettings } from "../contexts/SettingsContext";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

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
   const [availableUpdate, setAvailableUpdate] = useState<Update | "simulated" | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);
   const terminalRefs = useRef<Map<number, React.RefObject<TerminalHandle>>>(new Map());

   const notificationsEnabled = settings.notifications_enabled;

   // check for updates on mount and every hour
   useEffect(() => {
      const runCheck = async () => {
         if (import.meta.env.DEV && import.meta.env.VITE_SIMULATE_UPDATE === "true") {
            setAvailableUpdate("simulated");
            return;
         }
         try {
            const update = await check();
            if (update?.available) setAvailableUpdate(update);
         } catch {
            // silently ignore - no network, updater not configured, etc.
         }
      };

      runCheck();
      const id = setInterval(runCheck, UPDATE_CHECK_INTERVAL_MS);
      return () => clearInterval(id);
   }, []);

   const handleUpdate = useCallback(async () => {
      if (!availableUpdate) return;
      setIsUpdating(true);
      try {
         if (availableUpdate === "simulated") {
            // in dev simulation, just clear the badge after a short delay
            await new Promise((r) => setTimeout(r, 1500));
            setAvailableUpdate(null);
            setIsUpdating(false);
            return;
         }
         await availableUpdate.downloadAndInstall();
         await relaunch();
      } catch {
         setIsUpdating(false);
      }
   }, [availableUpdate]);

   // apply window opacity when settings are loaded
   useEffect(() => {
      if (!settingsLoaded) return;
      invoke("set_window_opacity", { opacity: settings.window_opacity });
   }, [settingsLoaded]);

   // apply terminal theme changes to all open terminals
   const terminalTheme = settings.terminal_theme;
   useEffect(() => {
      if (!settingsLoaded) return;
      terminalRefs.current.forEach((ref) => {
         ref.current?.updateTerminalTheme(terminalTheme);
      });
   }, [terminalTheme, settingsLoaded]);

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

            // clean up the ref for the closed tab
            terminalRefs.current.delete(tabId);

            if (newTabs.length === 0) {
               // closing the last tab - replace with a fresh one
               const freshId = nextTabId;
               setActiveTabId(freshId);
               setNextTabId((p) => p + 1);
               return [
                  {
                     id: freshId,
                     title: `Terminal ${freshId}`,
                     ptyId: null,
                     hasBell: false,
                  },
               ];
            }

            // if closing active tab, switch to another
            if (tabId === activeTabId) {
               const index = prev.findIndex((t) => t.id === tabId);
               const newActiveTab = newTabs[Math.max(0, index - 1)];
               setActiveTabId(newActiveTab.id);
            }

            return newTabs;
         });
      },
      [activeTabId, nextTabId]
   );

   const handleTabClick = useCallback((tabId: number) => {
      setActiveTabId(tabId);
      // clear bell state when tab is clicked
      setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, hasBell: false } : tab)));
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
      async (tabId: number, notification?: { title: string; body: string }) => {
         const tab = tabs.find((t) => t.id === tabId);
         if (!tab) return;

         // check if window is visible
         const isVisible = await invoke<boolean>("is_window_visible");

         // show notification if window is hidden OR if tab is not active
         const shouldNotify = !isVisible || tabId !== activeTabId;

         if (shouldNotify) {
            // set bell state (only if tab is not active)
            if (tabId !== activeTabId) {
               setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, hasBell: true } : t)));
            }

            // send notification only if enabled
            if (notificationsEnabled) {
               const permissionGranted = await isPermissionGranted();
               if (permissionGranted) {
                  // use provided notification data, or fall back to generic bell message
                  const title = notification?.title || "Terminal Bell";
                  const body =
                     notification?.body ||
                     (isVisible ? `Activity in ${tab.title}` : "Terminal activity");
                  sendNotification({ title, body });
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

   // close all tabs, open a fresh one, and hide the window
   const handleCloseAllAndHide = useCallback(() => {
      terminalRefs.current.clear();
      const freshId = nextTabId;
      setTabs([
         {
            id: freshId,
            title: `Terminal ${freshId}`,
            ptyId: null,
            hasBell: false,
         },
      ]);
      setActiveTabId(freshId);
      setNextTabId((p) => p + 1);
      handleCloseWindow();
   }, [nextTabId, handleCloseWindow]);

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

   // when window becomes visible, only clear tray badge if no tabs have unread bells
   useEffect(() => {
      const handleVisibilityChange = () => {
         setTabs((currentTabs) => {
            const hasAnyBells = currentTabs.some((t) => t.hasBell);
            if (!hasAnyBells) {
               invoke("set_tray_badge", { hasUnread: false });
            }
            return currentTabs;
         });
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
         // Cmd+Shift+W - close all tabs and hide
         else if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "w") {
            e.preventDefault();
            handleCloseAllAndHide();
         }
         // Cmd+W - close current tab
         else if (e.metaKey && e.key === "w") {
            e.preventDefault();
            handleTabClose(activeTabId);
         }
         // Cmd+M - hide barterm (or close settings)
         else if (e.metaKey && e.key === "m") {
            e.preventDefault();
            if (showSettings) {
               setShowSettings(false);
            } else {
               handleCloseWindow();
            }
         }
         // Cmd+, - toggle settings
         else if (e.metaKey && e.key === ",") {
            e.preventDefault();
            setShowSettings((prev) => !prev);
         }
         // Cmd+1-9 - switch to tab
         else if (e.metaKey && e.key >= "1" && e.key <= "9") {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            if (index < tabs.length) {
               handleTabClick(tabs[index].id);
            }
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [
      tabs,
      activeTabId,
      showSettings,
      handleNewTab,
      handleTabClick,
      handleTabClose,
      handleCloseWindow,
      handleCloseAllAndHide,
   ]);

   return (
      <div
         className={`h-screen w-full flex flex-col ${isDark ? "bg-gray-900" : "bg-gray-100"} fixed overflow-hidden overscroll-none rounded-xl`}
      >
         {availableUpdate && (
            <UpdateBadge isDark={isDark} onUpdate={handleUpdate} isUpdating={isUpdating} />
         )}
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
                     <div className="absolute top-0 right-1 z-50 h-full flex items-center justify-center">
                        <button
                           onClick={handleCloseWindow}
                           className="px-2 h-full text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-sm leading-none"
                           title="Hide (Cmd+M)"
                        >
                           ×
                        </button>
                     </div>
                  </TabBar>
               )}
               <div className="flex-1 relative pb-1">
                  {tabs.map((tab) => {
                     if (!terminalRefs.current.has(tab.id)) {
                        terminalRefs.current.set(tab.id, createRef<TerminalHandle>());
                     }
                     return (
                        <TerminalTab
                           key={tab.id}
                           tabId={tab.id}
                           isActive={tab.id === activeTabId}
                           theme={isDark ? darkTheme : lightTheme}
                           terminalTheme={terminalTheme}
                           terminalRef={terminalRefs.current.get(tab.id)!}
                           onBell={() => handleBell(tab.id)}
                           onNotification={(n) => handleBell(tab.id, n)}
                        />
                     );
                  })}
               </div>
            </>
         )}
      </div>
   );
}
