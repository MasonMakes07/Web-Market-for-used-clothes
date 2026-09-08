import { defineConfig } from "@playwright/test";

// Campus sign-in depends on Auth0 settings that Vite bakes in at server start,
// so both states get their own dev server: one with an approved connection
// configured and one without, which is what the app ships today.
//
// The configured server points at a reserved .example tenant and the test
// aborts every request to it, so this configuration cannot reach a real
// identity provider and no campus credential is ever involved.
export default defineConfig({
  testDir: "./tests/campus",
  fullyParallel: true,
  use: { channel: "chrome", trace: "retain-on-failure" },
  projects: [
    {
      name: "configured",
      testMatch: /campus-signin\.spec\.js/,
      use: { baseURL: "http://127.0.0.1:5176" },
    },
    {
      name: "unconfigured",
      testMatch: /campus-unconfigured\.spec\.js/,
      use: { baseURL: "http://127.0.0.1:5177" },
    },
  ],
  webServer: [
    {
      command:
        "VITE_AUTH0_DOMAIN=auth-test.example " +
        "VITE_AUTH0_CLIENT_ID=test-client-id " +
        "VITE_UCSD_AUTH0_CONNECTION=ucsd-test-connection " +
        "npx vite --host 127.0.0.1 --port 5176 --strictPort",
      url: "http://127.0.0.1:5176",
      reuseExistingServer: false,
    },
    {
      command: "npx vite --host 127.0.0.1 --port 5177 --strictPort",
      url: "http://127.0.0.1:5177",
      reuseExistingServer: false,
    },
  ],
});
