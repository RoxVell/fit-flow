import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/settings");
});

test("settings page shows theme and language controls", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /^Settings$/i })).toBeVisible();
  await expect(page.getByText(/^Theme$/i)).toBeVisible();
  await expect(page.getByText(/^Language$/i)).toBeVisible();

  // The theme + language controls live inside a single card with `divide-y`.
  const controls = page.locator("div.divide-y").first();
  await expect(controls).toBeVisible();

  // Theme has 3 options (system / dark / light) and language has 2 (EN / RU).
  // 5 buttons total inside the card.
  await expect(controls.getByRole("button")).toHaveCount(5);
});

test("configured sync recovers automatically without a manual control or key", async ({ page }) => {
  const requests: Record<string, string>[] = [];
  let configRequests = 0;
  // Finish requests from the shared setup before simulating a fresh launch.
  await page.goto("about:blank");
  await page.clock.install();
  await page.route("**/api/sync", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      if (++configRequests === 1) {
        await route.fulfill({ status: 503, json: { error: "Temporarily unavailable" } });
        return;
      }
      await route.fulfill({ json: { enabled: true } });
      return;
    }
    requests.push(request.headers());
    await route.fulfill({ json: {
      accepted: request.postDataJSON().changes.map((change: { id: string }) => change.id),
      superseded: [], rejected: [], serverChanges: [], serverTime: new Date().toISOString(),
    } });
  });
  await page.goto("/settings");
  const unavailable = page.getByRole("status").filter({ hasText: "Sync is unavailable" });
  await expect(unavailable).toBeVisible();
  expect(requests).toHaveLength(0);
  await expect(page.getByRole("button", { name: /^Sync now$/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sync across devices" })).toHaveCount(0);
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(configRequests).toBe(2);
  await expect(unavailable).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  expect(requests.every((headers) => headers.authorization === undefined)).toBe(true);
});

test("switching to Russian updates visible labels and persists across reload", async ({
  page,
}) => {
  // Click the RU language button.
  await page.getByRole("button", { name: /^RU$/i }).click();

  // The settings title in Russian is "Настройки" — must now be visible.
  await expect(page.getByRole("heading", { name: /Настройки/i })).toBeVisible();

  // Reload and verify the cookie persisted the language choice.
  await page.reload();
  await expect(page.getByRole("heading", { name: /Настройки/i })).toBeVisible();
});
