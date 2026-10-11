import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

test("active workout numbers exercises and can save a note plus deload flag", async ({
  page,
}) => {
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);

  const firstCard = page.locator(".rounded-2xl.border.bg-card").first();
  await expect(firstCard.getByText("1.").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("2.").first()).toBeVisible();

  await page.getByRole("button", { name: /exercise options/i }).first().click();
  await page.getByRole("menuitem", { name: /add note/i }).click();

  const note = page.getByRole("textbox", { name: /^note$/i });
  await expect(note).toBeVisible();
  await note.fill("close-grip handle");
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByText("close-grip handle").first()).toBeVisible();

  await page.getByRole("button", { name: /exercise options/i }).first().click();
  await page.getByRole("menuitem", { name: /don't count toward progress/i }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(firstCard.getByText(/deload/i)).toBeVisible();

  const firstWeight = page.getByRole("textbox", { name: /set 1 weight/i }).first();
  await firstWeight.fill("60");
  await firstWeight.blur();
  const firstReps = page.getByRole("spinbutton", { name: /set 1 reps/i }).first();
  await firstReps.fill("8");
  await firstReps.blur();
  await page.getByRole("button", { name: /complete set 1/i }).first().click();

  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  await page.getByRole("button", { name: /finish anyway/i }).click();
  await expect(
    page.getByText(/workout (complete|completed|finished)/i).first()
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: /^Done$/i }).click();
  await page.goto("/workout");
  await page.getByRole("tab", { name: /^History$/i }).click();

  const firstRow = page
    .locator(".divide-y.divide-border\\/50 > div")
    .first()
    .getByRole("button")
    .first();
  await firstRow.click();
  await expect(page.getByText("close-grip handle").first()).toBeVisible();
  await expect(page.getByText(/not in stats/i).first()).toBeVisible();
});
