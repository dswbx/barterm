import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal as XTerm, ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalNotification {
   title: string;
   body: string;
}

interface TerminalProps {
   onData: (data: string) => void;
   onResize: (cols: number, rows: number) => void;
   onBell?: () => void;
   onNotification?: (notification: TerminalNotification) => void;
   theme: ITheme;
}

export interface TerminalHandle {
   write: (data: string) => void;
   setTheme: (theme: ITheme) => void;
   focus: () => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
   ({ onData, onResize, onBell, onNotification, theme }, ref) => {
      const terminalRef = useRef<HTMLDivElement>(null);
      const xtermRef = useRef<XTerm | null>(null);
      const fitAddonRef = useRef<FitAddon | null>(null);

      // keep refs to callbacks so xterm handlers always call the latest version
      const onBellRef = useRef(onBell);
      const onNotificationRef = useRef(onNotification);
      const onDataRef = useRef(onData);
      const onResizeRef = useRef(onResize);

      useEffect(() => {
         onBellRef.current = onBell;
      }, [onBell]);
      useEffect(() => {
         onNotificationRef.current = onNotification;
      }, [onNotification]);
      useEffect(() => {
         onDataRef.current = onData;
      }, [onData]);
      useEffect(() => {
         onResizeRef.current = onResize;
      }, [onResize]);

      useEffect(() => {
         if (!terminalRef.current) return;

         // create xterm instance
         const term = new XTerm({
            fontFamily: 'MesloLGS NF, Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            cursorBlink: true,
            cursorStyle: "block",
            overviewRuler: {
               width: 0,
            },
            theme,
         });

         const fitAddon = new FitAddon();
         term.loadAddon(fitAddon);

         term.open(terminalRef.current);

         // fit the terminal after a short delay to ensure proper layout
         setTimeout(() => {
            fitAddon.fit();
            const { cols, rows } = term;
            onResizeRef.current(cols, rows);
         }, 0);

         // focus the terminal
         term.focus();

         // send data to PTY when user types
         term.onData((data) => {
            onDataRef.current(data);
         });

         // listen for bell events
         term.onBell(() => {
            onBellRef.current?.();
         });

         // register OSC notification handlers (9, 777, 99)
         const notify = (title: string, body: string) => {
            if (onNotificationRef.current) {
               onNotificationRef.current({ title, body });
            } else if (onBellRef.current) {
               // fall back to bell if no notification handler
               onBellRef.current();
            }
         };

         // OSC 9: iTerm2-style notification
         // format: ESC ] 9 ; <message> BEL
         term.parser.registerOscHandler(9, (data) => {
            notify("Terminal", data || "Notification");
            return true;
         });

         // OSC 777: urxvt-style notification
         // format: ESC ] 777 ; notify ; <title> ; <body> BEL
         term.parser.registerOscHandler(777, (data) => {
            const parts = data.split(";");
            if (parts[0] === "notify") {
               const title = parts[1]?.trim() || "Terminal";
               const body = parts[2]?.trim() || "Notification";
               notify(title, body);
            }
            return true;
         });

         // OSC 99: kitty-style notification
         // format: ESC ] 99 ; <params> ; <body> ST
         term.parser.registerOscHandler(99, (data) => {
            // params and body are separated by the first ';'
            const sepIndex = data.indexOf(";");
            const body =
               sepIndex >= 0 ? data.substring(sepIndex + 1) : data;
            notify("Terminal", body || "Notification");
            return true;
         });

         xtermRef.current = term;
         fitAddonRef.current = fitAddon;

         // handle window resize
         const handleResize = () => {
            if (fitAddonRef.current && xtermRef.current) {
               fitAddonRef.current.fit();
               const { cols, rows } = xtermRef.current;
               onResizeRef.current(cols, rows);
            }
         };

         window.addEventListener("resize", handleResize);

         return () => {
            window.removeEventListener("resize", handleResize);
            term.dispose();
         };
      }, []);

      // expose methods to parent
      useImperativeHandle(ref, () => ({
         write: (data: string) => {
            xtermRef.current?.write(data);
         },
         setTheme: (newTheme: ITheme) => {
            if (xtermRef.current) {
               xtermRef.current.options.theme = newTheme;
            }
         },
         focus: () => {
            xtermRef.current?.focus();
         },
      }));

      return (
         <div ref={terminalRef} className="w-full h-full p-2 pl-2.5 pr-1.5" />
      );
   }
);
