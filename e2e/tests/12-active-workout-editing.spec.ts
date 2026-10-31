import { test, expect, waitForSeed } from "../fixtures/base";
import { startWorkout } from "../fixtures/workout";
import type { ProgramEntity } from "../../src/lib/db/types";

async function readPrograms(page: import("@playwright/test").Page): Promise<ProgramEntity[]> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("fitflow_v2");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const read = database.transaction("programs").objectStore("programs").getAll();
      read.onsuccess = () => { database.close(); resolve(read.result); };
      read.onerror = () => { database.close(); reject(read.error); };
    };
  }));
}

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
  const programsBefore = await readPrograms(page);
  const firstCard = exerciseCards(page).first();
  // Use a uniquely named source: the library contains multiple Hip Thrust
  // variants with identical names but different exercise IDs.
  const original = "Jefferson Curl";
  await firstCard.getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();
  await page.getByPlaceholder(/search exercises/i).fill(original);
  await page.getByRole("dialog").getByRole("button", { name: /Jefferson Curl/ }).click();
  await page.getByRole("button", { name: "Only this workout", exact: true }).click();

  await firstCard.getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();

  const search = page.getByPlaceholder(/search exercises/i);
  await search.fill("Anderson Squat");
  await page.getByRole("button", { name: "Anderson Squat" }).click();
  await expect(search).toBeHidden();

  await page.getByRole("button", { name: "Only this workout", exact: true }).click();
  await expect(
    firstCard.getByRole("button", { name: "Anderson Squat", exact: true })
  ).toBeVisible();
  await expect(exerciseTitle(page, original!)).toHaveCount(0);
  expect(await readPrograms(page)).toEqual(programsBefore);

  // Return to the source exercise, reload, and check that its earlier
  // replacement is suggested before exercises from general usage history.
  await firstCard.getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();
  await page.getByPlaceholder(/search exercises/i).fill(original!);
  await page.getByRole("dialog").getByRole("button").filter({
    has: page.getByText(original!, { exact: true }),
  }).click();
  await page.getByRole("button", { name: "Only this workout", exact: true }).click();
  await page.reload();
  await exerciseCards(page).first().getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Previous replacements", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Anderson Squat/ })).toBeVisible();
  const buttons = await dialog.getByRole("button").allTextContents();
  expect(buttons.find((name) => name.trim() && name !== "Close")).toContain("Anderson Squat");
});

test("confirmed replacement updates all future program sessions and survives reload", async ({ page }) => {
  const before = (await readPrograms(page)).find((p) => p.isActive)!;
  const sessionId = new URL(page.url()).searchParams.get("session");
  const sourceId = before.sessions.find((s) => s.id === sessionId)!.exercises[0].exerciseId;
  const firstCard = exerciseCards(page).first();
  await firstCard.getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();
  await page.getByPlaceholder(/search exercises/i).fill("Anderson Squat");
  await page.getByRole("dialog").getByRole("button", { name: /Anderson Squat/ }).click();
  await page.getByRole("button", { name: "Update program", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  const after = (await readPrograms(page)).find((p) => p.id === before.id)!;
  const targetId = after.sessions.find((s) => s.id === sessionId)!.exercises[0].exerciseId;
  expect(targetId).not.toBe(sourceId);
  expect(after.sessions).toEqual(before.sessions.map((s) => ({
    ...s, exercises: s.exercises.map((e) => e.exerciseId === sourceId
      ? { ...e, exerciseId: targetId, exercise: undefined } : e),
  })));
  await expect(exerciseCards(page).first().getByRole("button", { name: "Anderson Squat", exact: true })).toBeVisible();
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
