import { defineConfig } from "@playwright/test";

// The install/offline checks must run against the production build, not Vite's dev server.
export default defineConfig({
  testDir: "./tests/pwa",
  use: { baseURL: "http://localhost:4173", channel: "chrome" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
