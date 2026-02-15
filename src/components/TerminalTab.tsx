import { Terminal, TerminalHandle } from "./Terminal";
import { usePty } from "../hooks/usePty";
import type { TerminalThemeSettings } from "../contexts/SettingsContext";

interface TerminalTabProps {
   tabId: number;
   isActive: boolean;
   theme: any;
   terminalTheme: TerminalThemeSettings;
   terminalRef: React.RefObject<TerminalHandle>;
   onBell: () => void;
   onNotification: (notification: { title: string; body: string }) => void;
}

export function TerminalTab({
   tabId,
   isActive,
   theme,
   terminalTheme,
   terminalRef,
   onBell,
   onNotification,
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
            onNotification={onNotification}
            theme={theme}
            terminalTheme={terminalTheme}
         />
      </div>
   );
}
