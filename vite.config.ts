import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import manifest from "./manifest.json";

export default defineConfig(({ mode }) => ({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        fullpage: "src/fullpage/index.html",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["*"],
    },
  },
}));
