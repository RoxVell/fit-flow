import { test, expect, waitForSeed } from "../fixtures/base";
import { finishQuickWorkout } from "../fixtures/workout";

/**
 * Progress screens *after* a workout exists. `05-progress.spec.ts` only
 * asserts the fresh-install empty states, which means every aggregation
 * that turns logged sets into charts (usage counts, 1RM history, weekly
 * volume, muscle load) was running untested.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await finishQuickWorkout(page);
  await page.getByRole("button", { name: /^Done$/i }).click();
});

test("exercises tab selects the logged exercise and drops the no-data state", async ({
  page,
}) => {
  await page.goto("/progress?tab=exercises");

  // The tab auto-selects the most-used exercise once usage counts exist.
  await expect(page.getByText(/no data yet/i)).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("tab", { name: /1RM/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /volume/i })).toBeVisible();
});

test("the logged session shows up in the exercise history accordion", async ({
  page,
}) => {
  await page.goto("/progress?tab=exercises");
  await expect(page.getByText(/no data yet/i)).toHaveCount(0, { timeout: 10_000 });

  // The accordion header is a plain label, not a heading element.
  await expect(page.getByText(/^History$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /expand all/i })).toBeVisible();
  await expect(page.getByText(/60\s*kg\s*×\s*8/i).first()).toBeVisible({
    timeout: 10_000,
  });
});

test("dashboard reflects the completed session", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText(/^Recent Workouts$/i)).toBeVisible({ timeout: 10_000 });
  // 60 kg × 8 reps = 480 kg of volume for the session.
  await expect(page.getByText(/480/).first()).toBeVisible();
});
