import { test, expect } from "../fixtures/base";

/**
 * The exercise catalog: 800+ static JSON entries rendered through a
 * virtualiser. Existing specs only asserted that the search box and the
 * card wrapper exist — filtering, the empty state and the detail sheet
 * (which lazily fetches `public/exercises/details/<id>.json`) were never
 * driven. Search is how anyone actually finds an exercise here.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/programs/library");
  await page.getByRole("tab", { name: /^Exercises$/i }).click();
  await expect(page.getByPlaceholder(/search exercises/i)).toBeVisible();
});

test("a search with no matches shows the empty state", async ({ page }) => {
  await page.getByPlaceholder(/search exercises/i).fill("zzzznotanexercise");

  await expect(page.getByText(/no exercises found/i)).toBeVisible({ timeout: 10_000 });
});

test("body-part chips filter the catalog and can be cleared", async ({ page }) => {
  const count = page.getByText(/^\d+ exercises$/);
  await expect(count).toBeVisible({ timeout: 10_000 });
  await expect(count).toHaveText(/^[1-9]\d{2,} exercises$/);
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

test("search narrows the list and opens the matching exercise detail", async ({ page }) => {
  await page.getByPlaceholder(/search exercises/i).fill("Anderson Squat");
  await expect(page.getByText(/^1 exercises$/)).toBeVisible();
  await page.getByRole("button", { name: "Anderson Squat" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Anderson Squat").first()).toBeVisible();

  await dialog.getByRole("button", { name: /^Close$/i }).click();
  await expect(dialog).toBeHidden();
});
