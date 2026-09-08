import { test, expect } from "@playwright/test";

// The app's current shipping state: no campus connection is configured.
// Learning.md lesson 14 requires campus sign-up to stay visibly unavailable
// until a real identity connection exists, so that has to be enforced by a
// test rather than by remembering to check the copy.

test("campus sign-in stays unavailable with no connection configured", async ({
  page,
  baseURL,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/#/profile");

  await expect(
    page.getByText(/UCSD sign-up is not available yet/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Continue with UCSD/i }),
  ).toBeDisabled();

  // While unconfigured the only third party the page may contact is the font
  // CDN the stylesheet imports. Matching on "auth0" alone would be wrong: the
  // vendored SDK's own local module URL contains that word.
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
