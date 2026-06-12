import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// `base` controls the public path of built assets. For GitHub Pages project
// sites the app is served from /<repo>/, so default to /football-oracle/.
// Override with VITE_BASE (e.g. "/" for a custom domain or local preview).
export default defineConfig(function () {
    var _a, _b;
    return ({
        base: (_a = process.env.VITE_BASE) !== null && _a !== void 0 ? _a : "/football-oracle/",
        plugins: [react()],
        server: {
            port: 5173,
            // Proxy API calls to the backend in dev so the frontend can use relative
            // /api paths without CORS friction.
            proxy: {
                "/api": {
                    target: (_b = process.env.VITE_DEV_API) !== null && _b !== void 0 ? _b : "http://localhost:4000",
                    changeOrigin: true,
                },
            },
        },
    });
});
