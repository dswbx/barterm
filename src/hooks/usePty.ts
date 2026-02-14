import { useEffect, useState, useCallback, useRef } from "react";
import { spawn, type IPty } from "tauri-pty";

interface UsePtyOptions {
   tabId: number;
   cols: number;
   rows: number;
   onData: (data: string) => void;
}

export function usePty({ tabId, cols, rows, onData }: UsePtyOptions) {
   const [error, setError] = useState<string | null>(null);
   const ptyRef = useRef<IPty | null>(null);

   // spawn PTY on mount
   useEffect(() => {
      let mounted = true;

      const spawnPty = async () => {
         try {
            const shell = import.meta.env.VITE_SHELL || "/bin/zsh";

            const pty = await spawn(shell, [], {
               cols,
               rows,
            });

            if (!mounted) {
               pty.kill();
               return;
            }

            ptyRef.current = pty;

            // listen for PTY output
            pty.onData((data) => {
               // @ts-expect-error
               onData(data);
            });
         } catch (err) {
            setError(err as string);
            console.error("Failed to spawn PTY:", err);
         }
      };

      spawnPty();

      return () => {
         mounted = false;
         if (ptyRef.current) {
            try {
               const killPromise = ptyRef.current.kill();
               if (killPromise && typeof killPromise.catch === "function") {
                  killPromise.catch(console.error);
               }
            } catch (err) {
               console.error("Failed to kill PTY:", err);
            }
         }
      };
   }, [tabId]);

   const write = useCallback(async (data: string) => {
      if (!ptyRef.current) {
         return;
      }
      try {
         await ptyRef.current.write(data);
      } catch (err) {
         console.error("Failed to write to PTY:", err);
      }
   }, []);

   const resize = useCallback(async (newCols: number, newRows: number) => {
      if (!ptyRef.current) return;
      try {
         await ptyRef.current.resize(newCols, newRows);
      } catch (err) {
         console.error("Failed to resize PTY:", err);
      }
   }, []);

   return { write, resize, error };
}
