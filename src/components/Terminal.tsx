import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal as XTerm, ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
   onData: (data: string) => void;
   onResize: (cols: number, rows: number) => void;
   theme: ITheme;
}

export interface TerminalHandle {
   write: (data: string) => void;
   setTheme: (theme: ITheme) => void;
   focus: () => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
   ({ onData, onResize, theme }, ref) => {
      const terminalRef = useRef<HTMLDivElement>(null);
      const xtermRef = useRef<XTerm | null>(null);
      const fitAddonRef = useRef<FitAddon | null>(null);

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
         onResize(cols, rows);
      }, 0);

      // focus the terminal
      term.focus();

      // send data to PTY when user types
      term.onData((data) => {
         onData(data);
      });

         xtermRef.current = term;
         fitAddonRef.current = fitAddon;

         // handle window resize
         const handleResize = () => {
            if (fitAddonRef.current && xtermRef.current) {
               fitAddonRef.current.fit();
               const { cols, rows } = xtermRef.current;
               onResize(cols, rows);
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

      return <div ref={terminalRef} className="w-full h-full p-2 pr-1.5" />;
   }
);
