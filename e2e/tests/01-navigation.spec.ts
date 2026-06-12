import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

test("root URL redirects to dashboard", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard$/);
  // The dashboard greeting renders the user's name ("Anton") on first paint.
  await expect(page.getByText(/Anton/).first()).toBeVisible();
});

test("bottom nav links route to every primary screen", async ({ page }) => {
  const nav = page.getByRole("navigation");
  await expect(nav).toBeVisible();

  await nav.getByRole("link", { name: /^Workout$/i }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole("heading", { name: /^Workout$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Programs$/i }).click();
  await expect(page).toHaveURL(/\/programs\/library$/);
  await expect(page.getByRole("heading", { name: /^Programs$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Progress$/i }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole("heading", { name: /^Progress$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Settings$/i }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: /^Settings$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Dashboard$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("start workout button on dashboard routes to the workout plan", async ({ page }) => {
  await page.getByRole("link", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout$/);
});
