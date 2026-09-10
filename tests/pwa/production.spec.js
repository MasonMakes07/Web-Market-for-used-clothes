import { test, expect } from "@playwright/test";

test("production manifest, installation assets, private-cache exclusion, and offline recovery", async ({
  page,
  context,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good finds/ })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBeTruthy();
  const cachedPaths = await page.evaluate(async () => {
    const paths = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith("triton-thrift-")) continue;
      const cache = await caches.open(name);
      paths.push(
        ...(await cache.keys()).map((value) => new URL(value.url).pathname),
      );
    }
    return paths.sort();
  });
  expect(cachedPaths).toEqual([
    "/app-icon-192.png",
    "/app-icon-512.png",
    "/offline.html",
  ]);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Back on campus soon." }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: /Good finds/ })).toBeVisible();
});
