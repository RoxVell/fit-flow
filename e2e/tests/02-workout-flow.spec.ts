import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

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

  // Pick the second session in the list.
  const options = dialog.getByRole("button");
  const count = await options.count();
  expect(count).toBeGreaterThan(1);
  await options.nth(1).click();

  // Dialog closes.
  await expect(dialog).toBeHidden();
});

test("user can start a workout, log a set, and finish the session", async ({ page }) => {
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();

  // We should now be on the active workout screen.
  await expect(page).toHaveURL(/\/workout\/active/);

  // Wait for the first exercise card to render.
  await expect(page.locator("input[inputmode='decimal']").first()).toBeVisible({
    timeout: 10_000,
  });

  // Fill the first weight input (decimal).
  const firstWeight = page.locator("input[inputmode='decimal']").first();
  await firstWeight.fill("60");
  await firstWeight.blur();

  // Fill the first reps input (numeric).
  const firstReps = page.locator("input[inputmode='numeric']").first();
  await firstReps.fill("8");
  await firstReps.blur();

  // The complete-set button (round checkmark) becomes enabled.
  const completeButtons = page.locator("button.rounded-full.border");
  await expect(completeButtons.first()).toBeEnabled();
  await completeButtons.first().click();

  // Open the finish confirmation.
  await page.getByRole("button", { name: /^Finish$/i }).first().click();

  // Confirm dialog appears with the localized "Finish anyway" button.
  const confirm = page.getByRole("button", { name: /finish anyway/i });
  await expect(confirm).toBeVisible({ timeout: 5_000 });
  await confirm.click();

  // Triumph screen shows the completion message.
  await expect(
    page.getByText(/workout (complete|completed|finished)/i).first(),
  ).toBeVisible({ timeout: 10_000 });
});
