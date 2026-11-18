import { test, expect } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/progress");
});

test("progress page opens the general tab and shows the muscle load heatmap", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /^Progress$/i })).toBeVisible();

  await expect(page.getByRole("tab", { name: /^General$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Exercises$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Body$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/Muscle Load/i)).toBeVisible();
});

test("body tab shows body measurement cards", async ({ page }) => {
  await page.getByRole("tab", { name: /^Body$/i }).click();
  await expect(page.getByText(/^Body Weight$/i)).toBeVisible();
  await expect(page.getByText(/^Body Measurements$/i)).toBeVisible();
});

test("exercises tab shows the no-data state on a fresh install", async ({ page }) => {
  await page.getByRole("tab", { name: /^Exercises$/i }).click();
  // Without logged workouts, the tab shows the localized "No data yet" message.
  await expect(page.getByText(/no data yet/i)).toBeVisible();
});
