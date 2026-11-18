import { test, expect, waitForSeed } from "../fixtures/base";
import { startWorkout, logFirstSet, finishWorkout } from "../fixtures/workout";

test("visiting /workout with an in-progress draft redirects to the active screen", async ({ page }) => {
  await startWorkout(page);
  await page.goto("/workout");
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(page.getByRole("button", { name: "Finish", exact: true }).first()).toBeVisible();
});

test("bottom navigation indicates a draft until the workout finishes", async ({ page }) => {
  await page.goto("/dashboard");
  const workoutLink = page.getByRole("navigation").getByRole("link", { name: /workout/i });
  const indicator = workoutLink.getByText(/active session in progress/i);
  const dot = workoutLink.locator("span.bg-green-500");
  await expect(workoutLink).toBeVisible();
  await expect(indicator).toHaveCount(0);
  await startWorkout(page);
  await expect(indicator).toBeVisible();
  await expect(dot).toBeVisible();
  await logFirstSet(page);
  await finishWorkout(page);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/workout (complete|completed|finished)/i)).toHaveCount(0);
  await expect(workoutLink).toBeVisible();
  await expect(indicator).toHaveCount(0);
  await expect(dot).toHaveCount(0);
});

test("workout plan shows an empty state when all programs are inactive", async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("fitflow_v2");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const database = req.result;
      const tx = database.transaction("programs", "readwrite");
      const store = tx.objectStore("programs");
      const programs = store.getAll();
      programs.onsuccess = () => {
        for (const program of programs.result) store.put({ ...program, isActive: false });
      };
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onabort = () => { database.close(); reject(tx.error); };
    };
  }));

  await page.goto("/workout");
  await expect(page.getByText(/no active program found/i)).toBeVisible();
  await expect(page.getByText(/create one in the programs tab/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /start workout/i })).toHaveCount(0);
});
