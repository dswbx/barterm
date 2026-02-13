import { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal, TerminalHandle } from './Terminal';
import { TabBar } from './TabBar';
import { usePty } from '../hooks/usePty';
import { lightTheme, darkTheme, getSystemTheme, watchSystemTheme } from '../lib/theme';
import { invoke } from '@tauri-apps/api/core';

interface Tab {
  id: number;
  title: string;
  ptyId: number | null;
}

export function TerminalManager() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: 'Terminal 1', ptyId: null }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);
  const [isDark, setIsDark] = useState(getSystemTheme() === 'dark');
  const terminalRefs = useRef<Map<number, React.RefObject<TerminalHandle>>>(new Map());

  const handleNewTab = useCallback(() => {
    const newTab: Tab = {
      id: nextTabId,
      title: `Terminal ${nextTabId}`,
      ptyId: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId((prev) => prev + 1);
  }, [nextTabId]);

  const handleTabClose = useCallback((tabId: number) => {
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
      return newTabs;
    });
  }, [activeTabId]);

  const handleTabClick = useCallback((tabId: number) => {
    setActiveTabId(tabId);
    // focus the terminal after switching tabs
    setTimeout(() => {
      terminalRefs.current.get(tabId)?.current?.focus();
    }, 0);
  }, []);

  const handleCloseWindow = useCallback(() => {
    invoke('close_window');
  }, []);

  // watch for system theme changes
  useEffect(() => {
    const unwatch = watchSystemTheme((theme) => {
      const dark = theme === 'dark';
      setIsDark(dark);
      
      // update all terminal themes
      terminalRefs.current.forEach((ref) => {
        ref.current?.setTheme(dark ? darkTheme : lightTheme);
      });
    });

    return unwatch;
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+T - new tab
      if (e.metaKey && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Cmd+W - close tab or window
      else if (e.metaKey && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          handleTabClose(activeTabId);
        } else {
          handleCloseWindow();
        }
      }
      // Cmd+1-9 - switch to tab
      else if (e.metaKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          setActiveTabId(tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, handleNewTab, handleTabClose, handleCloseWindow]);

  return (
    <div className={`h-screen w-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-100'} relative`}>
      {/* Close button */}
      <button
        onClick={handleCloseWindow}
        className="absolute top-2 right-2 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
        title="Close window (Cmd+W)"
      >
        ×
      </button>
      
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />
      <div className="flex-1 relative">
        {tabs.map((tab) => {
          if (!terminalRefs.current.has(tab.id)) {
            terminalRefs.current.set(tab.id, { current: null });
          }
          return (
            <TerminalTab
              key={tab.id}
              tabId={tab.id}
              isActive={tab.id === activeTabId}
              theme={isDark ? darkTheme : lightTheme}
              terminalRef={terminalRefs.current.get(tab.id)!}
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
}

function TerminalTab({ tabId, isActive, theme, terminalRef }: TerminalTabProps) {

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
      className={`absolute inset-0 ${isActive ? 'block' : 'hidden'}`}
      style={{ backgroundColor: theme.background }}
    >
      <Terminal
        ref={terminalRef}
        onData={handleData}
        onResize={handleResize}
        theme={theme}
      />
    </div>
  );
}
