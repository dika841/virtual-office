import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_DEV_ORIGIN = "http://localhost:8787";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		tailwindcss(),
	],
	server: {
		port: 5173,
		proxy: {
			"/api": { target: API_DEV_ORIGIN, changeOrigin: true },
			"/rpc": { target: API_DEV_ORIGIN, changeOrigin: true },
			"/health": { target: API_DEV_ORIGIN, changeOrigin: true },
			"/ws": { target: API_DEV_ORIGIN, changeOrigin: true, ws: true },
		},
	},
});
