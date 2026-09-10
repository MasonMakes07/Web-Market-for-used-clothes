import { test, expect } from "@playwright/test";

// Apple's provider setup is separate from Auth0 being configured at all, so a
// missing Apple connection must disable only Apple and explain itself.

test("Apple is disabled and says why, while Google still works", async ({
  page,
}) => {
  await page.goto("/#/profile");

  await expect(
    page.getByRole("button", { name: /Continue with Apple/i }),
  ).toBeDisabled();
  await expect(
    page.getByText(/Apple sign-in needs its provider setup/i),
  ).toBeVisible();

  // A missing Apple connection must not take Google down with it.
  await expect(
    page.getByRole("button", { name: /Continue with Google/i }),
  ).toBeEnabled();
});
