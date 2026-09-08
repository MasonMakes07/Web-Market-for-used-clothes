import { test, expect } from "@playwright/test";

// Proves the client half of campus sign-in without a real identity provider.
// The Auth0 Action and the scanner's token checks are covered by
// tests/campus-login.test.js and backend/test_scanner.py; the untested link was
// whether this app actually hands Auth0 the approved connection. Every request
// to the tenant is aborted, so no traffic leaves the machine and the assertion
// is on the authorize URL the app builds.

const DOMAIN = "auth-test.example";
const CLIENT_ID = "test-client-id";
const CONNECTION = "ucsd-test-connection";

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

test("campus sign-in sends Auth0 the approved connection", async ({
  page,
  baseURL,
}) => {
  const seen = await stubTenant(page);
  await page.goto("/#/profile");

  const button = page.getByRole("button", { name: /Continue with UCSD/i });
  await expect(button).toBeEnabled();
  // The unavailable notice must be gone once a connection is configured.
  await expect(
    page.getByText(/UCSD sign-up is not available yet/i),
  ).toHaveCount(0);

  await button.click();
  await expect.poll(() => seen.authorizeUrl, { timeout: 15000 }).not.toBeNull();

  const authorize = new URL(seen.authorizeUrl);
  expect(authorize.origin).toBe(`https://${DOMAIN}`);
  expect(authorize.pathname).toBe("/authorize");
  // The connection parameter is what pins the login to the campus provider.
  expect(authorize.searchParams.get("connection")).toBe(CONNECTION);
  expect(authorize.searchParams.get("client_id")).toBe(CLIENT_ID);
  expect(authorize.searchParams.get("response_type")).toBe("code");
  // PKCE, so no secret is ever needed or present in this client.
  expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();
  // Auth0 must send the user back to this app's own origin, nowhere else.
  expect(authorize.searchParams.get("redirect_uri")).toBe(
    new URL(baseURL).origin,
  );
});

test("no campus password or Duo code is ever collected in this app", async ({
  page,
}) => {
  await stubTenant(page);
  await page.goto("/#/profile");
  // The university owns the credential step; this origin must have no field for it.
  const account = page.locator(".tt-campus-account");
  await expect(account.locator('input[type="password"]')).toHaveCount(0);
  await expect(account.locator("input")).toHaveCount(0);
});

test("signing in is never presented as verified enrollment", async ({
  page,
}) => {
  await stubTenant(page);
  await page.goto("/#/profile");
  // Lesson 14: identity is not eligibility, and the copy must keep saying so.
  await expect(page.locator(".tt-campus-account")).toContainText(
    /university handles your password and Duo/i,
  );
  await expect(page.locator(".tt-profile-card")).toContainText(/not verified/i);
});
