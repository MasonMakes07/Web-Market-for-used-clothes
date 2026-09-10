import { test, expect } from "@playwright/test";

// Covers the sign-in that is actually wired today: Auth0 social connections.
// UCSD federation is planned but no UI reaches it yet, so its coverage stays at
// the layers that still exist — tests/campus-login.test.js for the Post Login
// Action and backend/test_scanner.py for the campus claim the API demands.
//
// Every request to the tenant is aborted, so nothing leaves the machine and the
// assertion is on the authorize URL the app builds.

const DOMAIN = "auth-test.example";
const CLIENT_ID = "test-client-id";
const GOOGLE = "google-oauth2";
const APPLE = "apple-test-connection";

// Capture the authorize redirect instead of following it to a real tenant.
async function stubTenant(page) {
  const seen = { authorizeUrl: null };
  await page.route(`https://${DOMAIN}/**`, (route) => {
    const url = route.request().url();
    if (url.includes("/authorize")) seen.authorizeUrl = url;
    return route.abort();
  });
  return seen;
}

// Every provider must hand Auth0 its own connection over PKCE and come back here.
async function expectAuthorize(seen, { connection, baseURL }) {
  await expect.poll(() => seen.authorizeUrl, { timeout: 15000 }).not.toBeNull();
  const authorize = new URL(seen.authorizeUrl);
  expect(authorize.origin).toBe(`https://${DOMAIN}`);
  expect(authorize.pathname).toBe("/authorize");
  expect(authorize.searchParams.get("connection")).toBe(connection);
  expect(authorize.searchParams.get("client_id")).toBe(CLIENT_ID);
  expect(authorize.searchParams.get("response_type")).toBe("code");
  // PKCE, so this public client never needs or holds a secret.
  expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();
  expect(authorize.searchParams.get("redirect_uri")).toBe(
    new URL(baseURL).origin,
  );
}

test("Google sign-in sends Auth0 the Google connection", async ({
  page,
  baseURL,
}) => {
  const seen = await stubTenant(page);
  await page.goto("/#/profile");
  const button = page.getByRole("button", { name: /Continue with Google/i });
  await expect(button).toBeEnabled();
  await button.click();
  await expectAuthorize(seen, { connection: GOOGLE, baseURL });
});

test("Apple sign-in sends Auth0 the Apple connection once configured", async ({
  page,
  baseURL,
}) => {
  const seen = await stubTenant(page);
  await page.goto("/#/profile");
  const button = page.getByRole("button", { name: /Continue with Apple/i });
  await expect(button).toBeEnabled();
  // The setup notice belongs only to an unconfigured Apple provider.
  await expect(
    page.getByText(/Apple sign-in needs its provider setup/i),
  ).toHaveCount(0);
  await button.click();
  await expectAuthorize(seen, { connection: APPLE, baseURL });
});

test("no password is ever collected in this origin", async ({ page }) => {
  await stubTenant(page);
  await page.goto("/#/profile");
  // The provider owns the credential step; this origin must have no field for it.
  const account = page.locator(".tt-campus-account");
  await expect(account.locator('input[type="password"]')).toHaveCount(0);
  await expect(account.locator("input")).toHaveCount(0);
});

test("signing in is never presented as proof of UCSD enrollment", async ({
  page,
}) => {
  await stubTenant(page);
  await page.goto("/#/profile");
  // Lesson 14: a Google or Apple account says nothing about being a student, so
  // the profile must keep saying the preview is unverified.
  await expect(page.locator(".tt-campus-account")).toContainText(
    /password stays with your sign-in provider/i,
  );
  await expect(page.locator(".tt-profile-card")).toContainText(
    /Device preview · not verified/i,
  );
});
