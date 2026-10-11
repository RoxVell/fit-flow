import { test, expect, waitForSeed } from "../fixtures/base";
import { startWorkout, logFirstSet } from "../fixtures/workout";

/**
 * FitFlow is offline-first: IndexedDB is the source of truth, not React
 * state. The user-visible promise is "close the app mid-set, come back,
 * nothing is lost". `06-resume-and-state.spec.ts` covers the *redirect*
 * to the active screen but never checked that the logged numbers survive
 * — a draft that reloaded empty would still pass that suite.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

test("logged sets survive a full page reload", async ({ page }) => {
  await startWorkout(page);
  await logFirstSet(page, "72.5", "9");

  await page.reload();

  await expect(page).toHaveURL(/\/workout\/active/);
  const weight = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await expect(weight).toHaveValue("72.5", { timeout: 10_000 });
  await expect(page.getByRole("spinbutton", { name: /set 1 reps/i }).first()).toHaveValue(
    "9"
  );
  // The completion tick is persisted too, not just the numbers.
  await expect(
    page.getByRole("button", { name: /complete set 1/i }).first()
  ).toHaveAttribute("aria-pressed", "true");
});

test("an exercise added mid-workout is still there after a reload", async ({ page }) => {
  await startWorkout(page);

  await page.getByRole("button", { name: /add exercise/i }).click();
  const search = page.getByPlaceholder(/search exercises/i);
  await search.fill("Jefferson Curl");
  await page.getByRole("button", { name: "Jefferson Curl" }).click();
  await expect(search).toBeHidden();
  // `exact` matters: "Complete set N, Jefferson Curl" also carries the name.
  const title = page.getByRole("button", { name: "Jefferson Curl", exact: true });
  await expect(title).toBeVisible();

  await page.reload();

  await expect(title).toBeVisible({ timeout: 10_000 });
});

test("navigating away and back resumes the draft with its logged values", async ({
  page,
}) => {
  await startWorkout(page);
  await logFirstSet(page, "55", "12");

  // Leave the workout entirely, then come back through the bottom nav.
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: /^Progress$/i })).toBeVisible();
  // The nav link carries an extra sr-only "active session" label while a
  // draft is open, so match loosely rather than anchoring on "Workout".
  await page.getByRole("navigation").getByRole("link", { name: /workout/i }).first().click();

  // The plan page bounces straight back to the in-progress session.
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(page.getByRole("textbox", { name: /set 1 weight/i }).first()).toHaveValue(
    "55",
    { timeout: 10_000 }
  );
});
