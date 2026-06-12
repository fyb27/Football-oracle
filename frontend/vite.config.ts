import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` controls the public path of built assets. For GitHub Pages project
// sites the app is served from /<repo>/, so default to /football-oracle/.
// Override with VITE_BASE (e.g. "/" for a custom domain or local preview).
export default defineConfig(() => ({
  base: process.env.VITE_BASE ?? "/football-oracle/",
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to the backend in dev so the frontend can use relative
    // /api paths without CORS friction.
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
