import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/progress");
});

test("progress page shows the three tab controls", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /^Progress$/i })).toBeVisible();

  await expect(page.getByRole("button", { name: /^General$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Exercises$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Body$/i })).toBeVisible();
});

test("general tab shows the muscle load heatmap", async ({ page }) => {
  // Default tab is general. The Muscle Load heatmap card is always visible
  // (it falls back to a neutral body silhouette when no data is logged).
  await expect(page.getByText(/Muscle Load/i)).toBeVisible();
});

test("body tab shows body measurement cards", async ({ page }) => {
  await page.getByRole("button", { name: /^Body$/i }).click();
  await expect(page.getByText(/^Body Weight$/i)).toBeVisible();
  await expect(page.getByText(/^Body Measurements$/i)).toBeVisible();
});

test("exercises tab shows the no-data state on a fresh install", async ({ page }) => {
  await page.getByRole("button", { name: /^Exercises$/i }).click();
  // Without logged workouts, the tab shows the localized "No data yet" message.
  await expect(page.getByText(/no data yet/i)).toBeVisible();
});
