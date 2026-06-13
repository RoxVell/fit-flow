import { test, expect, waitForSeed } from "../fixtures/base";

/**
 * Settings + locale persistence:
 *  - theme toggle applies / removes the `dark` class on <html>,
 *  - theme choice persists across reload,
 *  - locale persists across SPA navigation (not just reload).
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/settings");
});

/**
 * Returns the row that contains the given visible label text. The settings
 * page renders one card with `divide-y`; each row is `flex justify-between`
 * with a label span on the left and a toggle on the right.
 */
function settingsRow(page: import("@playwright/test").Page, label: RegExp) {
  return page.locator("div.divide-y > div").filter({ hasText: label });
}

/**
 * The theme toggle renders three icon-only buttons in a fixed order
 * (system / dark / light) — see src/components/settings/theme-toggle.tsx.
 */
const THEME_BUTTON_INDEX = { system: 0, dark: 1, light: 2 } as const;

test("clicking the dark theme button applies the dark class to <html>", async ({
  page,
}) => {
  // Default is "system" — no `dark` class is forced on <html>.
  const html = page.locator("html");
  const systemClass = await html.getAttribute("class");
  expect(systemClass ?? "").not.toContain("dark");

  // Click the dark button (2nd in the theme toggle).
  await settingsRow(page, /^Theme$/i)
    .locator("button")
    .nth(THEME_BUTTON_INDEX.dark)
    .click();

  // next-themes applies attribute="class" — explicit "dark" choice adds the
  // class regardless of system preference (pinned to light in playwright.config).
  const htmlClass = (await html.getAttribute("class")) ?? "";
  expect(htmlClass.split(/\s+/)).toContain("dark");
});

test("theme choice persists across reload", async ({ page }) => {
  // Click dark.
  await settingsRow(page, /^Theme$/i)
    .locator("button")
    .nth(THEME_BUTTON_INDEX.dark)
    .click();

  // next-themes persists to localStorage; the class should still be on
  // <html> after a hard reload.
  await page.reload();
  const htmlClass = (await page.locator("html").getAttribute("class")) ?? "";
  // Even on a system that's "light", next-themes adds the `dark` class
  // when the user explicitly picked "dark".
  expect(htmlClass.split(/\s+/)).toContain("dark");
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
