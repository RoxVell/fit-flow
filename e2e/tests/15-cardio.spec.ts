import { test, expect, waitForSeed } from "../fixtures/base";

/**
 * `/workout/cardio` was completely untested — no spec ever loaded the
 * route. It is the only screen that writes to the `cardioSessions` store,
 * and it is not linked from anywhere in the UI, so a regression there
 * would be invisible until someone deep-linked into it.
 *
 * CardioForm renders its labels as loose <label> siblings (no `htmlFor`),
 * so the numeric fields have to be addressed positionally. They appear in
 * a fixed DOM order — see src/components/cardio/cardio-form.tsx.
 */
const FIELD = { distance: 0, minutes: 1, seconds: 2, heartRate: 3 } as const;

function field(page: import("@playwright/test").Page, key: keyof typeof FIELD) {
  return page.getByRole("spinbutton").nth(FIELD[key]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/workout/cardio");
  await expect(page.getByRole("heading", { name: /^Cardio$/i })).toBeVisible();
});

test("save stays disabled until distance and duration are filled", async ({ page }) => {
  const save = page.getByRole("button", { name: /save cardio/i });
  await expect(save).toBeDisabled();

  await field(page, "distance").fill("5");
  await expect(save).toBeDisabled();

  await field(page, "minutes").fill("25");
  await expect(save).toBeEnabled();
});

test("seconds alone count as a duration", async ({ page }) => {
  // A sub-minute effort has no whole minutes to enter. The button state
  // has to follow the total duration, not the minutes field.
  await field(page, "distance").fill("0.2");
  await field(page, "seconds").fill("45");

  await expect(page.getByRole("button", { name: /save cardio/i })).toBeEnabled();
});

test("pace is derived from distance and duration", async ({ page }) => {
  // Pace is hidden until both inputs produce a positive value.
  await expect(page.getByText(/^Pace$/i)).toHaveCount(0);

  await field(page, "distance").fill("5");
  await field(page, "minutes").fill("25");

  // Blank seconds must not poison the arithmetic: 25:00 over 5 km.
  await expect(page.getByText(/^Pace$/i)).toBeVisible();
  await expect(page.getByText("5:00 /km")).toBeVisible();

  // Seconds refine the same figure: 25:30 over 5 km is 5.1 min/km.
  await field(page, "seconds").fill("30");
  await expect(page.getByText("5:06 /km")).toBeVisible();
});

test("a logged cardio session is saved and shown in history", async ({ page }) => {
  await field(page, "distance").fill("5");
  await field(page, "minutes").fill("25");
  await field(page, "heartRate").fill("148");

  await page.getByRole("button", { name: /save cardio/i }).click();

  // Saving redirects to the dashboard.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // Re-open the page: the session is read back out of IndexedDB.
  await page.goto("/workout/cardio");
  const historyRow = page.locator("div.rounded-xl.border.bg-card").filter({
    hasText: /^Run/,
  });
  await expect(historyRow).toBeVisible({ timeout: 10_000 });
  await expect(historyRow).toContainText("5 km");
  await expect(historyRow).toContainText("25m");
  await expect(historyRow).toContainText("148 bpm");
});
