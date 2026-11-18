import { test, expect } from "../fixtures/base";
import { startWorkout, logFirstSet, seedPreviousSet, finishWorkout } from "../fixtures/workout";

test("workout plan lists the seeded PPL session and shows start button", async ({ page }) => {
  await page.goto("/workout");

  // Page heading.
  await expect(page.getByRole("heading", { name: /^Workout$/i })).toBeVisible();
  // The seeded PPL program is visible in the program summary line.
  await expect(page.getByText(/PPL/).first()).toBeVisible();

  // The session card shows the day + recommended badge.
  await expect(page.getByText(/Today/i).first()).toBeVisible();
  // Exercise count is rendered (e.g. "5 exercises").
  await expect(page.getByText(/\d+\s+exercises/i).first()).toBeVisible();

  // The start button is enabled when a session is selected.
  await expect(page.getByRole("button", { name: /start workout/i })).toBeEnabled();
});

test("change-day picker lets the user pick a different session", async ({ page }) => {
  await page.goto("/workout");

  // The session card is a button that opens the change-day dialog.
  // It contains a session name, the day-of-week label, and the exercise count.
  const sessionCard = page.getByRole("button").filter({ hasText: /exercises/i }).first();
  await expect(sessionCard).toBeVisible();
  await sessionCard.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Dialog title is the localized "Change Day" string.
  await expect(page.getByText(/change day/i).first()).toBeVisible();

  const otherSession = dialog.getByRole("button", { name: /exercises/i })
    .filter({ hasNotText: /Today/i }).first();
  const nextName = await otherSession.locator("p").first().innerText();
  await otherSession.click();
  await expect(dialog).toBeHidden();
  await expect(sessionCard).toContainText(nextName);
});

test("user can start a workout, log a set, and finish the session", async ({ page }) => {
  await startWorkout(page);
  await seedPreviousSet(page);
  await logFirstSet(page);
  await finishWorkout(page);
  await expect(page.getByText(/\+10\.00 kg/i)).toBeVisible();
  await expect(page.getByText(/\+10\.00 kg/i).getByText("(+20.0%)", { exact: true })).toBeVisible();
});
