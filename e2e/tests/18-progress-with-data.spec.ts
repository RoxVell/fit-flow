import { test, expect } from "../fixtures/base";
import { finishQuickWorkout } from "../fixtures/workout";

test("exercises tab shows charts and history for the logged exercise", async ({
  page,
}) => {
  await finishQuickWorkout(page);
  await page.getByRole("button", { name: /^Done$/i }).click();
  await page.goto("/progress?tab=exercises");

  // The tab auto-selects the most-used exercise once usage counts exist.
  await expect(page.getByText(/no data yet/i)).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("tab", { name: /1RM/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /volume/i })).toBeVisible();

  // The accordion header is a plain label, not a heading element.
  await expect(page.getByText(/^History$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /expand all/i })).toBeVisible();
  await expect(page.getByText(/60\s*kg\s*×\s*8/i).first()).toBeVisible({
    timeout: 10_000,
  });
});
