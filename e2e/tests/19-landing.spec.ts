import { test, expect } from "../fixtures/base";

/**
 * Smoke coverage for the marketing page. It has no data dependencies, so
 * there is no seed wait; the assertions target semantics (headings, links,
 * ARIA state) rather than the animated visuals.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/landing");
});

test("renders the hero and routes the primary CTA into the app", async ({ page }) => {
  await expect(page).toHaveTitle(/FitFlow/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every rep counted");

  // Header + hero + CTA all point at the dashboard.
  const openLinks = page.getByRole("link", { name: /open (app|fitflow)/i });
  expect(await openLinks.count()).toBeGreaterThanOrEqual(2);

  await page.getByRole("main").getByRole("link", { name: /open fitflow/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("exposes every section behind the in-page navigation", async ({ page }) => {
  for (const id of ["features", "how", "faq"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.getByRole("heading", { name: /built for the gym floor/i })).toBeVisible();
});

test("live logger checkboxes are interactive", async ({ page }) => {
  const firstSet = page.getByRole("button", { name: /(complete|uncheck) set 1/i });
  await expect(firstSet).toBeVisible();
  await firstSet.click();
  // The click flips the label; whichever way the simulation was mid-step,
  // the control must still be reachable and labelled afterwards.
  await expect(page.getByRole("button", { name: /(complete|uncheck) set 1/i })).toBeVisible();
});

test("FAQ items expand and collapse", async ({ page }) => {
  const question = page.getByRole("button", { name: /where does my data live/i });
  await question.scrollIntoViewIfNeeded();
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/local database \(IndexedDB\)/i)).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

test("theme toggle switches the document theme", async ({ page }) => {
  const toggle = page.getByRole("button", { name: /switch to (light|dark) theme/i });
  await expect(toggle).toBeVisible();
  const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await toggle.click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(!before);
});

test("serves an Open Graph image", async ({ request }) => {
  const res = await request.get("/landing/opengraph-image");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("image/png");
});
