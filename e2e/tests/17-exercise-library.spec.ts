import { test, expect, waitForSeed } from "../fixtures/base";

/**
 * The exercise catalog: 800+ static JSON entries rendered through a
 * virtualiser. Existing specs only asserted that the search box and the
 * card wrapper exist — filtering, the empty state and the detail sheet
 * (which lazily fetches `public/exercises/details/<id>.json`) were never
 * driven. Search is how anyone actually finds an exercise here.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/programs/library");
  await page.getByRole("tab", { name: /^Exercises$/i }).click();
  await expect(page.getByPlaceholder(/search exercises/i)).toBeVisible();
});

test("the catalog loads and reports how many exercises it holds", async ({ page }) => {
  const count = page.getByText(/^\d+ exercises$/);
  await expect(count).toBeVisible({ timeout: 10_000 });

  const label = (await count.textContent()) ?? "";
  expect(Number.parseInt(label, 10)).toBeGreaterThan(100);
});

test("search narrows the list to matching exercises", async ({ page }) => {
  await page.getByPlaceholder(/search exercises/i).fill("Anderson Squat");

  await expect(page.getByText(/^1 exercises$/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Anderson Squat" })).toBeVisible();
});

test("a search with no matches shows the empty state", async ({ page }) => {
  await page.getByPlaceholder(/search exercises/i).fill("zzzznotanexercise");

  await expect(page.getByText(/no exercises found/i)).toBeVisible({ timeout: 10_000 });
});

test("body-part chips filter the catalog and can be cleared", async ({ page }) => {
  const count = page.getByText(/^\d+ exercises$/);
  await expect(count).toBeVisible({ timeout: 10_000 });
  const total = Number.parseInt((await count.textContent()) ?? "", 10);

  await page.getByText("Biceps", { exact: true }).click();
  await expect
    .poll(async () => Number.parseInt((await count.textContent()) ?? "", 10), {
      timeout: 10_000,
    })
    .toBeLessThan(total);

  // "All" resets the filter.
  await page.getByText("All", { exact: true }).click();
  await expect
    .poll(async () => Number.parseInt((await count.textContent()) ?? "", 10))
    .toBe(total);
});

test("tapping an exercise opens its detail sheet", async ({ page }) => {
  await page.getByPlaceholder(/search exercises/i).fill("Anderson Squat");
  await page.getByRole("button", { name: "Anderson Squat" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Anderson Squat").first()).toBeVisible();

  await dialog.getByRole("button", { name: /^Close$/i }).click();
  await expect(dialog).toBeHidden();
});
