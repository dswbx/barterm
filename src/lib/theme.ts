import { ITheme } from "@xterm/xterm";

export const lightTheme: ITheme = {
   background: "#ffffff",
   foreground: "#000000",
   cursor: "#000000",
   cursorAccent: "#ffffff",
   selectionBackground: "#b3d7ff",
   black: "#000000",
   red: "#c91b00",
   green: "#00c200",
   yellow: "#c7c400",
   blue: "#0225c7",
   magenta: "#c930c7",
   cyan: "#00c5c7",
   white: "#c7c7c7",
   brightBlack: "#676767",
   brightRed: "#ff6d67",
   brightGreen: "#5ff967",
   brightYellow: "#fefb67",
   brightBlue: "#6871ff",
   brightMagenta: "#ff76ff",
   brightCyan: "#5ffdff",
   brightWhite: "#feffff",
};

export const darkTheme: ITheme = {
   background: "#1a1a1a",
   foreground: "#ffffff",
   cursor: "#00ff00",
   cursorAccent: "#1a1a1a",
   selectionBackground: "#444444",
   black: "#000000",
   red: "#ff5555",
   green: "#50fa7b",
   yellow: "#f1fa8c",
   blue: "#bd93f9",
   magenta: "#ff79c6",
   cyan: "#8be9fd",
   white: "#bbbbbb",
   brightBlack: "#555555",
   brightRed: "#ff6e67",
   brightGreen: "#5af78e",
   brightYellow: "#f4f99d",
   brightBlue: "#caa9fa",
   brightMagenta: "#ff92d0",
   brightCyan: "#9aedfe",
   brightWhite: "#ffffff",
};

export function getSystemTheme(): "light" | "dark" {
   if (typeof window === "undefined") return "dark";
   return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function watchSystemTheme(callback: (theme: "light" | "dark") => void) {
   if (typeof window === "undefined") return () => {};

   const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

   const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? "dark" : "light");
   };

   mediaQuery.addEventListener("change", handler);

   return () => {
      mediaQuery.removeEventListener("change", handler);
   };
}
