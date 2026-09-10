import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Same-origin development proxy lets the phone reach the Mac's loopback-only scanner.
// Vite's dev proxy is not included in the production build or Vercel deployment.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/__owner-scanner": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__owner-scanner/, "/owner"),
      },
    },
  },
});
