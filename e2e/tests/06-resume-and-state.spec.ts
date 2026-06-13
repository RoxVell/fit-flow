import { test, expect, waitForSeed } from "../fixtures/base";
import type { Page } from "@playwright/test";

/**
 * State transitions around the workout plan page:
 *  - resuming an in-progress workout via the auto-redirect,
 *  - the bottom-nav "active session" indicator appearing and clearing,
 *  - the empty state when no program is active.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
});

/**
 * Deactivate every program in the fitflow_v2 IDB.
 *
 * The app's seed loader can re-run its migration on any page load
 * (`runLibraryMigration` is called from `ensureSeeded`, which is
 * invoked by several repos). The migration does a `clear()` followed
 * by a `bulkPut` in *separate* transactions, so there's a brief
 * window where the programs table is empty. We retry the read in
 * that case — the migration's clear is brief (a few microseconds),
 * so a handful of retries is enough to land on a moment when the
 * rows are visible.
 */
async function deactivateAllPrograms(
  page: Page,
  maxAttempts = 20,
): Promise<string[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await page.evaluate(
      () =>
        new Promise<{ ok: true; ids: string[] } | { ok: false }>(
          (resolve) => {
            const req = indexedDB.open("fitflow_v2");
            req.onsuccess = () => {
              const db = req.result;
              if (!db.objectStoreNames.contains("programs")) {
                db.close();
                return resolve({ ok: false });
              }
              const tx = db.transaction("programs", "readwrite");
              const store = tx.objectStore("programs");
              const allReq = store.getAll();
              allReq.onsuccess = () => {
                const rows = allReq.result as { id: string; isActive: boolean }[];
                if (rows.length === 0) {
                  // Migration in flight — abort and let the caller retry.
                  try {
                    tx.abort();
                  } catch {
                    /* noop */
                  }
                  db.close();
                  resolve({ ok: false });
                  return;
                }
                for (const r of rows) {
                  r.isActive = false;
                  store.put(r);
                }
                tx.oncomplete = () => {
                  db.close();
                  resolve({ ok: true, ids: rows.map((r) => r.id) });
                };
                tx.onerror = () => {
                  db.close();
                  resolve({ ok: false });
                };
                tx.onabort = () => {
                  db.close();
                  resolve({ ok: false });
                };
              };
              allReq.onerror = () => {
                db.close();
                resolve({ ok: false });
              };
            };
            req.onerror = () => resolve({ ok: false });
          },
        ),
    );

    if (result.ok) {
      return result.ids;
    }

    await page.waitForTimeout(50);
  }

  throw new Error(
    `deactivateAllPrograms: programs table stayed empty for ${maxAttempts} attempts — the seed migration never settled.`,
  );
}

test("visiting /workout with an in-progress draft redirects to the active screen", async ({
  page,
}) => {
  // Start a workout, then land on /workout again — the page should auto-redirect
  // to /workout/active?session=… via the useEffect in src/app/(main)/workout/page.tsx.
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);

  // Re-visiting the plan page redirects straight back to the active screen.
  await page.goto("/workout");
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(page.getByRole("button", { name: /finish/i }).first()).toBeVisible();
});

test("bottom-nav shows the active-session indicator while a draft is open", async ({
  page,
}) => {
  // No draft yet — the indicator is absent.
  const nav = page.getByRole("navigation");
  await expect(nav.getByText(/active session in progress/i)).toHaveCount(0);

  // Start a workout.
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);

  // The Workout nav link now carries the sr-only "Active session" label
  // and the visible green dot.
  const workoutLink = nav.getByRole("link", { name: /workout/i }).first();
  await expect(workoutLink.getByText(/active session in progress/i)).toBeVisible();
  await expect(workoutLink.locator("span.bg-green-500")).toBeVisible();
});

test("workout plan shows an empty state when the only program is inactive", async ({
  page,
}) => {
  // Deactivate every program in IDB. We retry in case the read lands
  // on the migration's clear-then-bulkPut window. The data is stable
  // *between* migrations.
  const ids = await deactivateAllPrograms(page);
  expect(ids.length).toBeGreaterThan(0);

  // Navigate (full page load) to /workout. The post-load migration
  // early-returns on `meta.schemaVersion >= 3`, so the seed is not
  // re-applied with `isActive: true`. The post-deactivation
  // `isActive: false` rows are what `useActiveProgram` reads.
  await page.goto("/workout");
  // Localized empty-state copy (en): "No active program found." and
  // "Create one in the programs tab."
  await expect(page.getByText(/no active program found/i)).toBeVisible();
  await expect(page.getByText(/create one in the programs tab/i)).toBeVisible();

  // No Start Workout button when there's no active program.
  await expect(page.getByRole("button", { name: /start workout/i })).toHaveCount(0);
});

test("the active-session indicator clears after the workout is finished", async ({
  page,
}) => {
  const nav = page.getByRole("navigation");

  // Start a workout so the indicator appears.
  await page.goto("/workout");
  await page.getByRole("button", { name: /start workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);
  const workoutLink = nav.getByRole("link", { name: /workout/i }).first();
  await expect(workoutLink.getByText(/active session in progress/i)).toBeVisible();

  // Log one set so the finish flow doesn't bail on the "no completed sets" path.
  const firstWeight = page.locator("input[inputmode='decimal']").first();
  await firstWeight.fill("60");
  await firstWeight.blur();
  const firstReps = page.locator("input[inputmode='numeric']").first();
  await firstReps.fill("8");
  await firstReps.blur();
  await page.locator("button.rounded-full.border").first().click();

  // Finish the workout.
  await page.getByRole("button", { name: /^Finish$/i }).first().click();
  await page.getByRole("button", { name: /finish anyway/i }).click();

  // Wait for the triumph screen, then close it.
  await expect(
    page.getByText(/workout (complete|completed|finished)/i).first(),
  ).toBeVisible({ timeout: 10_000 });
  // The localized "Done" button closes the triumph overlay.
  await page.getByRole("button", { name: /done/i }).first().click();

  // Indicator should be gone — no more draft, no more green dot, no sr-only text.
  await expect(
    nav.getByRole("link", { name: /workout/i }).first().getByText(
      /active session in progress/i,
    ),
  ).toHaveCount(0);
});