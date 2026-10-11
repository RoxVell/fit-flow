import { expect, type Page } from "@playwright/test";

/**
 * Start the recommended session from the plan page and wait for the first
 * set row to render. Returns once the active screen is interactive.
 */
export async function startWorkout(page: Page) {
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(
    page.getByRole("textbox", { name: /set 1 weight/i }).first()
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * Fill weight + reps on the first set of the first exercise and tick it
 * complete. `blur()` matters: SetRow only commits the weight on blur.
 */
export async function logFirstSet(page: Page, weight = "60", reps = "8") {
  const firstWeight = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await expect(firstWeight).toBeVisible({ timeout: 10_000 });
  await firstWeight.fill(weight);
  await firstWeight.blur();

  const firstReps = page.getByRole("spinbutton", { name: /set 1 reps/i }).first();
  await firstReps.fill(reps);
  await firstReps.blur();

  const completeSet = page.getByRole("button", { name: /complete set 1/i }).first();
  await expect(completeSet).toBeEnabled();
  await completeSet.click();
  await expect(completeSet).toHaveAttribute("aria-pressed", "true");
}

/** Log one set and finish the active workout, landing on the triumph screen. */
export async function finishQuickWorkout(page: Page) {
  await startWorkout(page);
  await logFirstSet(page);

  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  const confirm = page.getByRole("button", { name: /finish anyway/i });
  await expect(confirm).toBeVisible({ timeout: 5_000 });
  await confirm.click();

  await expect(
    page.getByText(/workout (complete|completed|finished)/i).first()
  ).toBeVisible({ timeout: 10_000 });
}

/** Close triumph and open the workout history tab. */
export async function openWorkoutHistory(page: Page) {
  await page.getByRole("button", { name: /^Done$/i }).click();
  await page.goto("/workout");
  await page.getByRole("tab", { name: /^History$/i }).click();
  await expect(
    page
      .getByText(/workout history|no completed workouts yet/i)
      .first()
  ).toBeVisible();
}

/** Expand the first workout row in the history list. */
export async function expandFirstHistoryRow(page: Page) {
  const firstRow = page
    .locator(".divide-y.divide-border\\/50 > div")
    .first()
    .getByRole("button")
    .first();
  await expect(firstRow).toBeVisible({ timeout: 5_000 });
  await firstRow.click();
}
