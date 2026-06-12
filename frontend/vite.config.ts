import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` controls the public path of built assets. For GitHub Pages project
// sites the app is served from /<repo>/, so default to /football-oracle/.
// Override with VITE_BASE (e.g. "/" for a custom domain or local preview).
// The app is fully client-side (no backend), so no dev proxy is needed.
export default defineConfig(() => ({
  base: process.env.VITE_BASE ?? "/football-oracle/",
  plugins: [react()],
  server: { port: 5173 },
}));
