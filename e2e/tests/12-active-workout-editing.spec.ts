import { test, expect } from "../fixtures/base";
import { startWorkout, logFirstSet, seedPreviousSet } from "../fixtures/workout";
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
  await startWorkout(page);
});

/** Exercise cards on the active screen. */
function exerciseCards(page: import("@playwright/test").Page) {
  return page.locator(".rounded-2xl.border.bg-card");
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

test("clearing suggested values keeps a set empty after other workout edits", async ({ page }) => {
  await seedPreviousSet(page);
  await page.reload();

  const firstCard = exerciseCards(page).first();
  const weight = firstCard.getByRole("textbox", { name: /set 1 weight/i });
  const reps = firstCard.getByRole("spinbutton", { name: /set 1 reps/i });
  const complete = firstCard.getByRole("button", { name: /complete set 1,/i });
  await expect(weight).toHaveValue("50");
  await expect(reps).toHaveValue("8");
  await weight.fill("");
  await weight.blur();
  await reps.fill("");
  await reps.blur();

  // Editing the draft rebuilds history suggestions. It must not restore
  // values the user deliberately cleared or enable completing an empty set.
  const setCount = await firstCard.getByRole("textbox", { name: /weight/i }).count();
  await firstCard.getByRole("button", { name: /add set/i }).click();
  await expect(firstCard.getByRole("textbox", { name: /weight/i })).toHaveCount(setCount + 1);
  await expect(weight).toHaveValue("");
  await expect(reps).toHaveValue("");
  await expect(complete).toBeDisabled();
  await expect(complete).toHaveAttribute("aria-pressed", "false");
});

test("swiping a set removes it as soon as the workout is interactive", async ({ page }) => {
  const firstCard = exerciseCards(page).first();
  const weights = firstCard.getByRole("textbox", { name: /weight/i });
  const count = await weights.count();
  const row = firstCard.getByText("1", { exact: true }).first().locator("..");
  await row.hover({ trial: true }); // Wait for the expanding card to receive pointer events.
  const box = await row.boundingBox();
  expect(box).not.toBeNull();
  // Start in the row's empty spacer so the gesture doesn't focus an input.
  const x = box!.x + box!.width * 0.45;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 90, y, { steps: 12 });
  await page.mouse.up();
  await expect(weights).toHaveCount(count - 1);
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
  // Flushing the trace and video for two full catalog openings can exceed 30s.
  test.setTimeout(60_000);
  const programsBefore = await readPrograms(page);
  const firstCard = exerciseCards(page).first();
  const original = await firstCard.getByRole("button").first().innerText();
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
  await expect(firstCard.getByRole("button", { name: original, exact: true })).toHaveCount(0);
  expect(await readPrograms(page)).toEqual(programsBefore);

  // A fresh workout from the same template keeps the original exercise and
  // remembers the replacement selected in the previous workout.
  await page.getByRole("button", { name: "Finish", exact: true }).first().click();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("button", { name: "Abandon", exact: true }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await startWorkout(page);
  await expect(firstCard.getByRole("button", { name: original, exact: true })).toBeVisible();
  await exerciseCards(page).first().getByRole("button", { name: /exercise options/i }).click();
  await page.getByRole("menuitem", { name: /swap exercise/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Previous replacements", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button").first()).toHaveAccessibleName(/Anderson Squat/);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(firstCard.getByRole("button", { name: original, exact: true })).toBeVisible();
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

  await logFirstSet(page);

  // The timer bar is the parent flex row of the "Rest timer" label; its
  // only button is the skip control (an icon-only SkipForward).
  const restBar = page.getByText(/^Rest timer$/i).locator("..");
  await expect(restBar).toBeVisible();
  // The seeded program's 90s rest renders as a mm:ss countdown.
  await expect(restBar.getByText(/^\d:\d{2}$/)).toBeVisible();

  await restBar.getByRole("button").click();
  await expect(page.getByText(/^Rest timer$/i)).toHaveCount(0);
});
