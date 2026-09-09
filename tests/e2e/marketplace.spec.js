import { test, expect } from "@playwright/test";
import path from "node:path";

// Waits for the IndexedDB commit rather than assuming UI state is already durable.
async function persisted(page) {
  await page.waitForTimeout(350);
  await expect(page.getByText("Saving…", { exact: true })).toHaveCount(0);
}

test("browse, combine filters, save, and keep the save after reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good finds/ })).toBeVisible();
  await page
    .getByRole("button", {
      name: "Save The everyday oversized hoodie",
      exact: true,
    })
    .click();
  await persisted(page);
  await page.reload();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Saved", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View The everyday oversized hoodie" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("combobox", { name: "College", exact: true })
    .selectOption("Sixth");
  await page.getByLabel("Maximum price").fill("25");
  await page.getByRole("button", { name: "Show finds" }).click();
  await expect(page.locator(".tt-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "View The everyday oversized hoodie" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("upload a photo, preserve draft, publish a free listing, then mark sold", async ({
  page,
}) => {
  await page.goto("/#/sell");
  await page
    .locator("input[type=file][multiple]")
    .setInputFiles(path.resolve("public/app-icon-192.png"));
  await expect(page.getByAltText("Listing photo 1")).toBeVisible();
  await page.getByLabel("Listing title").fill("Free campus test shirt");
  await page.getByLabel("Your price").fill("0");
  await persisted(page);
  await page.reload();
  await expect(page.getByLabel("Listing title")).toHaveValue(
    "Free campus test shirt",
  );
  await expect(page.getByAltText("Listing photo 1")).toBeVisible();
  await page.getByRole("button", { name: "Post to my preview" }).click();
  await expect(
    page.getByRole("heading", { name: "A good place to start." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Free campus test shirt/ }).click();
  await page.getByRole("button", { name: "Edit listing", exact: true }).click();
  await page.getByLabel("Your price").fill("12.50");
  await page.getByRole("button", { name: "Save listing changes" }).click();
  await expect(page.locator(".tt-own-listing")).toHaveCount(1);
  await expect(page.locator(".tt-own-listing")).toContainText("$12.5");
  await page
    .getByLabel("Status of Free campus test shirt")
    .selectOption("sold");
  await persisted(page);
  await page.reload();
  await expect(page.getByLabel("Status of Free campus test shirt")).toHaveValue(
    "sold",
  );
  await page.getByRole("button", { name: "Delete my local data" }).click();
  await page.getByRole("button", { name: "Keep my data" }).click();
  await expect(
    page.getByLabel("Status of Free campus test shirt"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete my local data" }).click();
  await page
    .getByRole("button", { name: "Delete local data", exact: true })
    .click();
  await persisted(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "View Free campus test shirt" }),
  ).toHaveCount(0);
});

test("render every main screen without overflow or JavaScript errors", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good finds/ })).toBeVisible();
  for (const label of ["Discover", "Saved", "Sell", "Inbox", "Profile"]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`${label.toLowerCase()}.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("local message and confirmed pickup export through both calendar paths", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "View The everyday oversized hoodie" })
    .click();
  await page.getByRole("button", { name: "Message seller in preview" }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Could we meet at Geisel?");
  await page.getByRole("button", { name: "Save message in preview" }).click();
  await expect(
    page.getByText("Could we meet at Geisel?", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Schedule a campus pickup" }).click();
  await page.getByLabel("Date and time").fill("2027-09-12T14:30");
  await page.getByRole("button", { name: "Propose pickup" }).click();
  await page
    .getByRole("button", { name: "Simulate sample seller accepting" })
    .click();
  const google = page.getByRole("link", { name: /Google Calendar/ });
  await expect(google).toHaveAttribute(
    "href",
    /calendar\.google\.com\/calendar\/render\?/,
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Apple / .ics" }).click();
  expect((await download).suggestedFilename()).toBe("triton-thrift-pickup.ics");
  await page
    .getByRole("button", { name: "Cancel pickup", exact: true })
    .click();
  await expect(google).toHaveCount(0);
});

test("scanner fails honestly without credentials and does not fake item details", async ({
  page,
}) => {
  await page.goto("/#/sell");
  await page
    .locator("input[type=file][multiple]")
    .setInputFiles(path.resolve("public/app-icon-192.png"));
  await page.getByRole("checkbox", { name: /Send up to 3 photos/ }).check();
  await page.getByRole("button", { name: "Scan my item" }).click();
  await expect(page.getByRole("alert")).toContainText("not connected yet");
  await expect(page.getByLabel("Listing title")).toHaveValue("");
});

test("storage failure shows a recoverable error without overwriting local data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      value: {
        open() {
          throw new Error("Storage unavailable");
        },
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByText(/Existing data has not been replaced/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
});

test("actions also work on insecure phone LAN origins without randomUUID", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "randomUUID", { value: undefined });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "View Vintage straight-leg denim" })
    .click();
  await page.getByRole("button", { name: "Message seller in preview" }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Testing from my phone");
  await page.getByRole("button", { name: "Save message in preview" }).click();
  await expect(page.locator(".tt-bubble-me")).toContainText(
    "Testing from my phone",
  );
});

// A missing university connection must never masquerade as successful student signup.
test("UCSD signup explains pending setup without collecting a university password", async ({
  page,
}) => {
  await page.goto("/#/profile");
  const account = page.getByRole("region", { name: "UCSD account" });
  await expect(
    account.getByRole("button", { name: "Continue with Apple" }),
  ).toBeDisabled();
  await expect(account.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(
    page.getByText("Device preview · not verified", { exact: true }),
  ).toBeVisible();
});

// Exercise actual picker events, drag/drop, and rejection without relying on hidden-input uploads alone.
test("phone photo picker and desktop drop share safe upload controls", async ({
  page,
}) => {
  await page.goto("/#/sell");
  const uploader = page.getByRole("region", { name: "Listing photos" });
  const photo = path.resolve("public/app-icon-192.png");
  const pickerPromise = page.waitForEvent("filechooser");
  await uploader
    .getByRole("button", { name: "Add photo", exact: true })
    .click();
  const picker = await pickerPromise;
  expect(picker.isMultiple()).toBeTruthy();
  await picker.setFiles(photo);
  await expect(page.getByAltText("Listing photo 1")).toBeVisible();

  const cameraPromise = page.waitForEvent("filechooser");
  await uploader
    .getByRole("button", { name: "Take photo", exact: true })
    .click();
  const cameraPicker = await cameraPromise;
  expect(await cameraPicker.element().getAttribute("capture")).toBe(
    "environment",
  );
  await cameraPicker.setFiles(path.resolve("public/app-icon-512.png"));
  await expect(page.getByAltText("Listing photo 2")).toBeVisible();
  await page.getByRole("button", { name: "Make photo 2 the cover" }).click();
  await persisted(page);

  const dropped = await page.evaluateHandle(async () => {
    const bytes = await (await fetch("/app-icon-192.png")).arrayBuffer();
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "drop.png", { type: "image/png" }));
    return transfer;
  });
  await uploader.dispatchEvent("dragenter", { dataTransfer: dropped });
  await expect(uploader).toHaveClass(/is-dragging/);
  await uploader.dispatchEvent("drop", { dataTransfer: dropped });
  await expect(page.getByAltText("Listing photo 3")).toBeVisible();
  await expect(uploader).not.toHaveClass(/is-dragging/);
  await dropped.dispose();

  await page
    .locator("input[type=file][multiple]")
    .setInputFiles({
      name: "not-a-photo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a photo"),
    });
  await expect(page.getByRole("alert")).toContainText("Choose a JPEG");
  await expect(page.locator(".tt-upload-photo")).toHaveCount(3);
  await page.getByRole("button", { name: "Remove photo 3" }).click();
  await persisted(page);
  await page.reload();
  await expect(page.locator(".tt-upload-photo")).toHaveCount(2);
});
