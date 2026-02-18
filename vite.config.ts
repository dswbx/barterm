/// <reference types="@types/node" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
   define: {
      "import.meta.env.VITE_VERSION": JSON.stringify(
         packageJson.version + (isDev ? "-dev" : "")
      ),
   },
   plugins: [react()],
   clearScreen: false,
   server: {
      port: 1420,
      strictPort: true,
      watch: {
         ignored: ["**/src-tauri/**"],
      },
   },
});
