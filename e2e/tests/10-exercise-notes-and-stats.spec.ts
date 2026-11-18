import { test, expect } from "../fixtures/base";
import { startWorkout, logFirstSet, finishWorkout, openWorkoutHistory, expandFirstHistoryRow } from "../fixtures/workout";

test("active workout numbers exercises and can save a note plus deload flag", async ({
  page,
}) => {
  await startWorkout(page);

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

  await logFirstSet(page);
  await finishWorkout(page);
  await openWorkoutHistory(page);
  await expandFirstHistoryRow(page);
  await expect(page.getByText("close-grip handle").first()).toBeVisible();
  await expect(page.getByText(/not in stats/i).first()).toBeVisible();
});
