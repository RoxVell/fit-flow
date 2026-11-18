import { test, expect } from "../fixtures/base";
import { startWorkout } from "../fixtures/workout";

test("create program form shows rest duration stepper", async ({ page }) => {
  await page.goto("/programs/create");

  await expect(page.getByText(/rest between sets/i)).toBeVisible();
  await expect(page.getByText("1:30")).toBeVisible();

  await page.getByRole("button", { name: /increase rest duration/i }).click();
  await expect(page.getByText("1:45")).toBeVisible();
});

test("exercises tab renders the library inside a shared card container", async ({
  page,
}) => {
  await page.goto("/programs/library");
  await page.getByRole("tab", { name: /^exercises$/i }).click();

  const card = page.locator(".rounded-xl.border.bg-card").first();
  await expect(card).toBeVisible();
  await expect(card.getByPlaceholder(/search/i)).toHaveCount(0);
  await expect(card.locator("button").first()).toBeVisible();
});

test("active workout opens exercise history sheet from the exercise name", async ({
  page,
}) => {
  await startWorkout(page);

  const exerciseName = page.locator("button.underline").first();
  await expect(exerciseName).toBeVisible({ timeout: 10_000 });
  const exerciseLabel = (await exerciseName.textContent())?.trim() ?? "";
  expect(exerciseLabel.length).toBeGreaterThan(0);
  await exerciseName.click();

  const sheet = page.locator('[data-slot="sheet-content"]');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { name: exerciseLabel })).toBeVisible();

  const box = await sheet.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    expect(box.height).toBeGreaterThanOrEqual(viewport.height * 0.65);
    expect(box.height).toBeLessThanOrEqual(viewport.height * 0.75);
  }

  await expect(sheet.getByText(/^history$/i)).toBeVisible();
  await expect(sheet.getByText(/no data yet/i)).toBeVisible();

  if (viewport) {
    await page.mouse.click(viewport.width / 2, Math.round(viewport.height * 0.12));
  }

  await expect(sheet).toBeHidden();
});
