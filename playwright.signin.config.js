import { defineConfig } from "@playwright/test";

// Auth0 settings are baked in by Vite at server start, so each configuration
// state gets its own dev server: fully configured, Apple provider missing, and
// nothing configured at all.
//
// The tenant is a reserved .example domain and the tests abort every request to
// it, so this configuration cannot reach a real identity provider and no
// credential is ever involved.
// Every variable is set explicitly, including to empty, because Vite also loads
// the developer's gitignored .env: relying on omission would make these tests
// pass or fail depending on whose machine they run on.
const AUTH0 =
  "VITE_AUTH0_DOMAIN=auth-test.example VITE_AUTH0_CLIENT_ID=test-client-id ";

export default defineConfig({
  testDir: "./tests/signin",
  fullyParallel: true,
  use: { channel: "chrome", trace: "retain-on-failure" },
  projects: [
    {
      name: "configured",
      testMatch: /social-signin\.spec\.js/,
      use: { baseURL: "http://127.0.0.1:5176" },
    },
    {
      name: "apple-off",
      testMatch: /apple-unconfigured\.spec\.js/,
      use: { baseURL: "http://127.0.0.1:5177" },
    },
    {
      name: "unconfigured",
      testMatch: /signin-unconfigured\.spec\.js/,
      use: { baseURL: "http://127.0.0.1:5178" },
    },
  ],
  webServer: [
    {
      command:
        AUTH0 +
        "VITE_GOOGLE_AUTH0_CONNECTION=google-oauth2 " +
        "VITE_APPLE_AUTH0_CONNECTION=apple-test-connection " +
        "npx vite --host 127.0.0.1 --port 5176 --strictPort",
      url: "http://127.0.0.1:5176",
      reuseExistingServer: false,
    },
    {
      command:
        AUTH0 +
        "VITE_GOOGLE_AUTH0_CONNECTION=google-oauth2 " +
        "VITE_APPLE_AUTH0_CONNECTION= " +
        "npx vite --host 127.0.0.1 --port 5177 --strictPort",
      url: "http://127.0.0.1:5177",
      reuseExistingServer: false,
    },
    {
      command:
        "VITE_AUTH0_DOMAIN= VITE_AUTH0_CLIENT_ID= " +
        "npx vite --host 127.0.0.1 --port 5178 --strictPort",
      url: "http://127.0.0.1:5178",
      reuseExistingServer: false,
    },
  ],
});
