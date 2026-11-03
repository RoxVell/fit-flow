import { test, expect, waitForSeed } from "../fixtures/base";

/**
 * Logging a body snapshot. `05-progress.spec.ts` only asserted that the
 * Body tab renders its two chart cards; the `/progress/body/log` route and
 * `logBodyMeasurement` were never exercised, so the whole write path —
 * and the empty-to-populated transition of the charts — was untested.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/progress?tab=body");
  await expect(page.getByRole("tab", { name: /^Body$/i })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("body tab starts empty and links to the log form", async ({ page }) => {
  await expect(page.getByText(/no measurements yet/i).first()).toBeVisible();

  await page.getByRole("button", { name: /log measurement/i }).click();
  await expect(page).toHaveURL(/\/progress\/body\/log$/);
  await expect(page.getByRole("heading", { name: /log measurement/i })).toBeVisible();
});

test("save is disabled until at least one metric is entered", async ({ page }) => {
  await page.getByRole("button", { name: /log measurement/i }).click();

  const save = page.getByRole("button", { name: /^Save$/i });
  await expect(save).toBeDisabled();

  await page.getByRole("spinbutton", { name: /^Weight \(kg\)$/i }).fill("81.4");
  await expect(save).toBeEnabled();
});

test("a logged snapshot lands in the history list and the charts", async ({ page }) => {
  await page.getByRole("button", { name: /log measurement/i }).click();

  await page.getByRole("spinbutton", { name: /^Weight \(kg\)$/i }).fill("81.4");
  await page.getByRole("spinbutton", { name: /^Chest \(cm\)$/i }).fill("104");
  // Bilateral metrics get a side suffix in their accessible name.
  await page.getByRole("spinbutton", { name: /left arm \(cm\) \(left\)/i }).fill("38.5");

  await page.getByRole("button", { name: /^Save$/i }).click();

  // Saving routes back to the Body tab.
  await expect(page).toHaveURL(/\/progress\?tab=body$/, { timeout: 10_000 });

  // The history section only renders once a snapshot exists.
  await expect(page.getByRole("heading", { name: /^History$/i })).toBeVisible({
    timeout: 10_000,
  });
  const summary = page.getByText(/81\.4 kg · 104 cm chest · 38\.5 cm L arm/);
  await expect(summary).toBeVisible();

  // The charts flip out of their empty state.
  await expect(page.getByText(/no measurements yet/i)).toHaveCount(0);
});

test("back leaves the log form without saving", async ({ page }) => {
  await page.getByRole("button", { name: /log measurement/i }).click();
  await page.getByRole("spinbutton", { name: /^Weight \(kg\)$/i }).fill("81.4");

  await page.getByRole("button", { name: /^Back$/i }).click();

  await expect(page).toHaveURL(/\/progress/);
  await expect(page.getByText(/no measurements yet/i).first()).toBeVisible();
});

test("swiping a measurement reveals its delete action", async ({ page }) => {
  await page.getByRole("button", { name: /log measurement/i }).click();
  await page.getByRole("spinbutton", { name: /^Weight \(kg\)$/i }).fill("81.4");
  await page.getByRole("button", { name: /^Save$/i }).click();
  const summary = page.getByText("81.4 kg", { exact: true });
  await expect(summary).toBeVisible();
  await summary.scrollIntoViewIfNeeded();
  const box = await summary.boundingBox();
  if (!box) throw new Error("Measurement row is missing");
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 80, y, { steps: 12 });
  await page.mouse.up();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /^Delete$/i }).click();
  await expect(summary).toHaveCount(0);
  await expect(page.getByText(/no measurements yet/i).first()).toBeVisible();
});
