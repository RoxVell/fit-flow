import { test, expect } from "../fixtures/base";

/**
 * Settings + locale persistence:
 *  - theme toggle applies / removes the `dark` class on <html>,
 *  - theme choice persists across reload,
 *  - locale persists across SPA navigation (not just reload).
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/settings");
});

test("switching from the light system theme to dark persists across reload", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
});

test("locale persists across SPA navigation, not just reload", async ({ page }) => {
  // Switch to Russian.
  await page.getByRole("button", { name: /^RU$/i }).click();
  await expect(page.getByRole("heading", { name: /Настройки/i })).toBeVisible();

  // Navigate to the dashboard via the bottom nav — the locale should
  // already be in the React tree (the cookie was set in the same tick),
  // and the dashboard heading should be "Главная", not "Dashboard".
  await page.getByRole("navigation").getByRole("link", { name: /Главная/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // Dashboard greeting: "Готов жать, Anton?" or similar — the "Anton"
  // part is what we anchor on since the greeting text varies by day.
  await expect(page.getByText(/Anton/).first()).toBeVisible();

  // Navigate again to a different tab to confirm the locale sticks.
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Программы/i })
    .click();
  await expect(page).toHaveURL(/\/programs\/library$/);
  await expect(page.getByRole("heading", { name: /Программы/i, level: 1 })).toBeVisible();
});
