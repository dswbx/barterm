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
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

interface Tab {
   id: number;
   title: string;
   ptyId: number | null;
   hasBell: boolean;
}

export function TerminalManager() {
   const [tabs, setTabs] = useState<Tab[]>([
      { id: 1, title: "Terminal 1", ptyId: null, hasBell: false },
   ]);
   const [activeTabId, setActiveTabId] = useState(1);
   const [nextTabId, setNextTabId] = useState(2);
   const [isDark, setIsDark] = useState(getSystemTheme() === "dark");
   const terminalRefs = useRef<Map<number, React.RefObject<TerminalHandle>>>(
      new Map()
   );

   // request notification permission on mount
   useEffect(() => {
      const requestNotificationPermission = async () => {
         let permissionGranted = await isPermissionGranted();
         if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === "granted";
         }
      };
      requestNotificationPermission();
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

   const handleBell = useCallback(async (tabId: number) => {
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
               prev.map((t) => (t.id === tabId ? { ...t, hasBell: true } : t))
            );
         }

         // send notification
         const permissionGranted = await isPermissionGranted();
         if (permissionGranted) {
            const notificationBody = isVisible ? `Activity in ${tab.title}` : "Terminal activity";
            sendNotification({
               title: "Terminal Bell",
               body: notificationBody,
            });
            
            // show window near cursor after a short delay if user doesn't interact
            // (this provides a better UX for background notifications)
         }

         // update tray icon badge
         await invoke("set_tray_badge", { hasUnread: true });
      }
   }, [tabs, activeTabId]);

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
         className={`h-screen w-full flex flex-col ${isDark ? "bg-gray-900" : "bg-gray-100"} fixed overflow-hidden overscroll-none`}
      >
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
                  terminalRefs.current.set(tab.id, createRef<TerminalHandle>());
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
