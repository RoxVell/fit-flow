import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

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
  await page.getByRole("button", { name: /^exercises$/i }).click();

  const card = page.locator(".rounded-xl.border.bg-card").first();
  await expect(card).toBeVisible();
  await expect(card.getByPlaceholder(/search/i)).toHaveCount(0);
  await expect(card.locator("button").first()).toBeVisible();
});

test("active workout opens exercise history sheet from the exercise name", async ({
  page,
}) => {
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);

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

test("triumph screen covers the full viewport after finishing a workout", async ({
  page,
}) => {
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);

  const firstWeight = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await expect(firstWeight).toBeVisible({ timeout: 10_000 });
  await firstWeight.fill("60");
  await firstWeight.blur();

  const firstReps = page.getByRole("spinbutton", { name: /set 1 reps/i }).first();
  await firstReps.fill("8");
  await firstReps.blur();

  await page.getByRole("button", { name: /complete set 1/i }).first().click();
  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  await page.getByRole("button", { name: /finish anyway/i }).click();

  await expect(
    page.getByText(/workout (complete|completed|finished)/i).first(),
  ).toBeVisible({ timeout: 10_000 });

  const triumph = page.locator(".fixed.inset-0").filter({
    has: page.getByText(/workout (complete|completed|finished)/i),
  });
  await expect(triumph).toBeVisible();

  const box = await triumph.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 2);
  }
});
