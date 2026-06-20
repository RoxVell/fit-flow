import { test, expect, waitForSeed } from "../fixtures/base";
import { finishQuickWorkout, openWorkoutHistory, expandFirstHistoryRow } from "../fixtures/workout";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

test("workout page shows plan and history tabs", async ({ page }) => {
  await page.goto("/workout");

  await expect(page.getByRole("button", { name: /^Plan$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^History$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /start workout/i })).toBeVisible();

  await page.getByRole("button", { name: /^History$/i }).click();
  await expect(
    page.getByText(/no completed workouts yet/i).first()
  ).toBeVisible();
});

test("dashboard no longer shows recent workouts section", async ({ page }) => {
  await expect(page.getByText(/^Recent Workouts$/i)).toHaveCount(0);
});

test("history tab lists a completed workout after finishing a session", async ({
  page,
}) => {
  await finishQuickWorkout(page);
  await openWorkoutHistory(page);

  await expandFirstHistoryRow(page);
  await expect(page.getByText(/60\s*kg\s*×\s*8/i).first()).toBeVisible();
});

test("user can edit set values from workout history", async ({ page }) => {
  await finishQuickWorkout(page);
  await openWorkoutHistory(page);

  await expandFirstHistoryRow(page);

  await page.getByRole("button", { name: /^Edit$/i }).click();

  const weightInput = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await weightInput.fill("65");
  await weightInput.blur();

  await page.getByRole("button", { name: /^Save$/i }).click();

  await expect(page.getByText(/65\s*kg\s*×\s*8/i).first()).toBeVisible({
    timeout: 5_000,
  });
});

test("user can delete a workout from history", async ({ page }) => {
  await finishQuickWorkout(page);
  await openWorkoutHistory(page);

  await expandFirstHistoryRow(page);

  await page.getByRole("button", { name: /^Delete$/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /^Delete$/i }).click();

  await expect(page.getByText(/no completed workouts yet/i)).toBeVisible({
    timeout: 5_000,
  });
});
