import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// In dev, proxy /api to the backend so the Vite server and API share an origin.
export default defineConfig({
  root: "frontend",
  plugins: [react()],
  resolve: { alias: { "@app/shared": resolve(__dirname, "../shared/index.ts") } },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
