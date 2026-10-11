import { test, expect, waitForSeed } from "../fixtures/base";
import { startWorkout } from "../fixtures/workout";

/**
 * The abandon path out of an active workout. Every existing test finishes
 * a session; nothing walked the `Finish → Discard → Abandon` chain, which
 * is the only way to get rid of a draft you started by mistake. It is
 * also the only destructive flow guarded by two confirmations, so the
 * escape hatches matter.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await startWorkout(page);
});

test("finishing with nothing logged offers discard and clears the draft", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Finish$/i }).first().click();

  // With zero completed sets there is no "Finish anyway" — only discard.
  const confirmDialog = page.getByRole("dialog");
  await expect(confirmDialog.getByText(/no completed sets/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /finish anyway/i })).toHaveCount(0);

  await page.getByRole("button", { name: /^Discard$/i }).click();

  // Second confirmation before the draft is thrown away.
  await expect(page.getByText(/abandon workout\?/i)).toBeVisible();
  await page.getByRole("button", { name: /^Abandon$/i }).click();

  // Back on the plan page with a fresh start button and no draft left.
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole("button", { name: /start workout/i })).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("navigation").getByText(/active session in progress/i)
  ).toHaveCount(0);
});

test("cancelling the finish dialog leaves the workout running", async ({ page }) => {
  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  await expect(page.getByText(/no completed sets/i)).toBeVisible();

  await page.getByRole("button", { name: /^Cancel$/i }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(page.getByRole("textbox", { name: /set 1 weight/i }).first()).toBeVisible();
});

test("backing out of the abandon confirmation keeps the draft", async ({ page }) => {
  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  await page.getByRole("button", { name: /^Discard$/i }).click();
  await expect(page.getByText(/abandon workout\?/i)).toBeVisible();

  await page.getByRole("button", { name: /^Cancel$/i }).click();

  await expect(page).toHaveURL(/\/workout\/active/);
  // Draft still registered: revisiting the plan page redirects back.
  await page.goto("/workout");
  await expect(page).toHaveURL(/\/workout\/active/);
});
