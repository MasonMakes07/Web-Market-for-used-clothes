import { test, expect } from "@playwright/test";

// No Auth0 application configured: the app must degrade to something honest
// rather than to a button that fails after the user taps it.

test("sign-in is unavailable and contacts no provider", async ({
  page,
  baseURL,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/#/profile");

  await expect(
    page.getByText(/sign-in need the secure HTTPS app link/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Continue with Google/i }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Continue with Apple/i }),
  ).toBeDisabled();

  // The only third party the page may contact is the font CDN the stylesheet
  // imports; matching on "auth0" alone would hit the vendored SDK's own URL.
  const origin = new URL(baseURL).origin;
  const fontHosts = [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ];
  const thirdParty = requests.filter(
    (url) =>
      !url.startsWith(origin) &&
      !fontHosts.some((host) => url.startsWith(host)),
  );
  expect(thirdParty).toEqual([]);
});

test("the device preview never claims the profile is verified", async ({
  page,
}) => {
  await page.goto("/#/profile");
  await expect(page.locator(".tt-profile-card")).toContainText(
    /Device preview · not verified/i,
  );
});
