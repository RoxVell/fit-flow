import { test, expect, waitForSeed } from "../fixtures/base";
import { startWorkout } from "../fixtures/workout";

/**
 * Mid-session edits on the active workout screen. These mutate the
 * IndexedDB draft through `useActiveWorkout` (addSet / addExercise /
 * removeExercise / swapExercise) — the code path a user hits every time
 * the gym doesn't match the plan. None of it was covered before.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await startWorkout(page);
});

/** Exercise cards on the active screen. */
function exerciseCards(page: import("@playwright/test").Page) {
  return page.locator(".rounded-2xl.border.bg-card");
}

/**
 * The exercise-name button that opens the history sheet. `exact` is
 * required: the "Complete set N, <exercise>" buttons embed the same name
 * in their aria-label.
 */
function exerciseTitle(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

test("user can append a set to an exercise", async ({ page }) => {
  const firstCard = exerciseCards(page).first();
  const setsBefore = await firstCard.getByRole("textbox", { name: /weight/i }).count();

  await firstCard.getByRole("button", { name: /add set/i }).click();

  await expect(firstCard.getByRole("textbox", { name: /weight/i })).toHaveCount(
    setsBefore + 1
  );
  await expect(
    firstCard.getByRole("button", { name: new RegExp(`complete set ${setsBefore + 1}`, "i") })
  ).toBeVisible();
});

test("user can add an extra exercise mid-workout", async ({ page }) => {
  const cardsBefore = await exerciseCards(page).count();

  await page.getByRole("button", { name: /add exercise/i }).click();
  const search = page.getByPlaceholder(/search exercises/i);
  await search.fill("Jefferson Curl");
  await page.getByRole("button", { name: "Jefferson Curl" }).click();
  await expect(search).toBeHidden();

  await expect(exerciseCards(page)).toHaveCount(cardsBefore + 1);
  // New exercises are appended, so the added one lands in the last card.
  await expect(
    exerciseCards(page).last().getByRole("button", { name: "Jefferson Curl", exact: true })
  ).toBeVisible();
});

test("user can swap an exercise for a different one", async ({ page }) => {
  const firstCard = exerciseCards(page).first();
  const original = (await firstCard.locator("button.underline").textContent())?.trim();
  expect(original).toBeTruthy();

  await firstCard.getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();

  const search = page.getByPlaceholder(/search exercises/i);
  await search.fill("Anderson Squat");
  await page.getByRole("button", { name: "Anderson Squat" }).click();
  await expect(search).toBeHidden();

  await expect(
    firstCard.getByRole("button", { name: "Anderson Squat", exact: true })
  ).toBeVisible();
  await expect(exerciseTitle(page, original!)).toHaveCount(0);
});

test("completing a set starts the rest timer, which can be skipped", async ({ page }) => {
  // No set completed yet — no timer.
  await expect(page.getByText(/^Rest timer$/i)).toHaveCount(0);

  const firstWeight = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await firstWeight.fill("60");
  await firstWeight.blur();
  const firstReps = page.getByRole("spinbutton", { name: /set 1 reps/i }).first();
  await firstReps.fill("8");
  await firstReps.blur();
  await page.getByRole("button", { name: /complete set 1/i }).first().click();

  // The timer bar is the parent flex row of the "Rest timer" label; its
  // only button is the skip control (an icon-only SkipForward).
  const restBar = page.getByText(/^Rest timer$/i).locator("..");
  await expect(restBar).toBeVisible();
  // The seeded program's 90s rest renders as a mm:ss countdown.
  await expect(restBar.getByText(/^\d:\d{2}$/)).toBeVisible();

  await restBar.getByRole("button").click();
  await expect(page.getByText(/^Rest timer$/i)).toHaveCount(0);
});
