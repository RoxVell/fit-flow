import { test, expect, waitForSeed } from "../fixtures/base";

/**
 * The full "bring your own program" journey, which is the main reason a
 * user opens the Programs tab at all:
 *   create → activate → train from it → edit → delete.
 *
 * `04-programs.spec.ts` only checks that the create form renders and can
 * be cancelled; nothing exercised `createProgram` / `updateProgram` /
 * `deleteProgram` end to end.
 *
 * "Anderson Squat" and "Jefferson Curl" are the only exercises in
 * `public/exercises/manifest.json` matching those search terms, so the
 * picker resolves to exactly one row.
 */

const PROGRAM_NAME = "E2E Strength Block";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

/**
 * Pick an exercise in the ExercisePickerDialog. The picker is the only
 * surface with the "Search exercises..." placeholder, so it doubles as a
 * scope even while the session-editor dialog is still mounted underneath.
 */
async function pickExercise(page: import("@playwright/test").Page, name: string) {
  const search = page.getByPlaceholder(/search exercises/i);
  await expect(search).toBeVisible();
  await search.fill(name);
  // A picker row's accessible name is "<exercise> <body part>", so this is
  // deliberately a substring match.
  await page.getByRole("button", { name }).click();
  await expect(search).toBeHidden();
}

/**
 * The card for one program in the library. Each program renders exactly
 * one `Set active: <name>` radio, which is the only per-card unique
 * handle — `.overflow-hidden` on its own also matches shared ancestors.
 */
function programCard(page: import("@playwright/test").Page, name: string) {
  return page.locator('[data-slot="card"]').filter({
    has: page.getByRole("radio", { name: `Set active: ${name}` }),
  });
}

test("user can create a program, activate it and train from it", async ({ page }) => {
  await page.goto("/programs/create");

  await page.getByPlaceholder(/push\/pull\/legs/i).fill(PROGRAM_NAME);

  // No sessions yet — the empty state offers the first one.
  await page.getByRole("button", { name: /create first session/i }).click();

  // Adding a session opens the session editor dialog straight away.
  const sessionDialog = page.getByRole("dialog");
  await expect(sessionDialog.getByText(/edit session/i)).toBeVisible();

  const sessionName = page.getByPlaceholder(/session name/i);
  await sessionName.fill("Full Body A");

  await page.getByRole("button", { name: /^Add$/i }).click();
  await pickExercise(page, "Anderson Squat");
  await page.getByRole("button", { name: /^Add$/i }).click();
  await pickExercise(page, "Jefferson Curl");

  // Close the session editor — SessionEditorDialog commits on close.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  // The form now lists the session with its exercise count.
  await expect(page.getByText("Full Body A")).toBeVisible();
  await expect(page.getByText(/^2 exercises$/i)).toBeVisible();

  // Save returns to the library with the new program listed.
  await page.getByRole("button", { name: /^Save$/i }).click();
  await expect(page).toHaveURL(/\/programs\/library$/);
  await expect(page.getByText(PROGRAM_NAME)).toBeVisible();

  // A freshly created program is not active yet — activate it.
  const radio = page.getByRole("radio", { name: `Set active: ${PROGRAM_NAME}` });
  await radio.click();
  await expect(radio).toBeChecked();

  // The plan page picks it up and starting a workout loads its exercises.
  await page.goto("/workout");
  await expect(page.getByText(PROGRAM_NAME).first()).toBeVisible();
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);
  // `exact` matters: the per-set "Complete set N, <exercise>" buttons also
  // contain the exercise name.
  await expect(
    page.getByRole("button", { name: "Anderson Squat", exact: true })
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByRole("button", { name: "Jefferson Curl", exact: true })
  ).toBeVisible();
});

test("editing a program renames it in the library", async ({ page }) => {
  await page.goto("/programs/library");

  await programCard(page, "PPL").getByRole("link", { name: /^Edit$/i }).click();
  await expect(page).toHaveURL(/\/programs\/create\?edit=/);

  // Edit mode pre-populates the form from the stored program.
  const nameInput = page.getByPlaceholder(/push\/pull\/legs/i);
  await expect(nameInput).toHaveValue("PPL");
  await nameInput.fill("PPL Reloaded");

  await page.getByRole("button", { name: /^Update$/i }).click();
  await expect(page).toHaveURL(/\/programs\/library$/);
  await expect(page.getByText("PPL Reloaded")).toBeVisible();
  await expect(page.getByText(/^PPL$/)).toHaveCount(0);
});

test("user can delete a program from the library", async ({ page }) => {
  await page.goto("/programs/library");
  await expect(page.getByText(/^Upper \/ Lower$/).first()).toBeVisible();

  await programCard(page, "Upper / Lower")
    .getByRole("button", { name: /delete program/i })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/upper \/ lower/i)).toBeVisible();
  await dialog.getByRole("button", { name: /^Delete$/i }).click();

  await expect(page.getByText(/^Upper \/ Lower$/)).toHaveCount(0);
  // The seeded PPL program is untouched.
  await expect(page.getByText(/^PPL$/).first()).toBeVisible();
});
