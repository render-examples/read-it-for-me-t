/**
 * Vite build for the Svelte SPA.
 * Dev server proxies /api and /health to the Express web service.
 */
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  root: "frontend",
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_API_PROXY ?? "http://127.0.0.1:3000",
      "/health": process.env.VITE_API_PROXY ?? "http://127.0.0.1:3000",
    },
  },
});
