import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { logFirstSet, startWorkout } from "../fixtures/workout";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation")).toBeVisible();
  // The worker claims clients after precaching HTML/assets and warming RSC.
  // Waiting only for serviceWorker.ready would miss that last activation step.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 45_000,
  });
});

test("the installed app reloads and opens the bare origin offline without a database", async ({ page, context, request }) => {
  const config = await request.get("/api/sync");
  expect(config.ok()).toBe(true);
  expect(await config.json()).toMatchObject({ enabled: false });

  await context.setOffline(true);
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Weight", { exact: true })).toBeVisible();
});

test("offline navigation reaches screens that were not visited during installation", async ({ page, context }) => {
  await context.setOffline(true);
  const nav = page.getByRole("navigation");
  for (const name of ["Workout", "Programs", "Settings", "Progress"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }

  // This nested route is not a bottom-nav prefetch from the initial dashboard.
  await page.getByRole("tab", { name: "Body", exact: true }).click();
  await page.getByRole("button", { name: "Log measurement", exact: true }).click();
  await expect(page).toHaveURL(/\/progress\/body\/log$/);
  await expect(page.getByRole("spinbutton", { name: "Weight (kg)", exact: true })).toBeVisible();
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
});

test("a workout started offline retains its draft and completed history after reloads", async ({ page, context }) => {
  await context.setOffline(true);
  await startWorkout(page);
  await logFirstSet(page, "72.5", "9");

  await page.reload();
  await expect(page.getByRole("textbox", { name: /set 1 weight/i }).first()).toHaveValue("72.5");
  await expect(page.getByRole("spinbutton", { name: /set 1 reps/i }).first()).toHaveValue("9");
  await expect(page.getByRole("button", { name: /complete set 1/i }).first()).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("navigation").getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Progress", exact: true })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: /workout/i }).click();
  await expect(page).toHaveURL(/\/workout\/active/);
  await expect(page.getByRole("textbox", { name: /set 1 weight/i }).first()).toHaveValue("72.5");

  await page.getByRole("button", { name: "Finish", exact: true }).first().click();
  await page.getByRole("button", { name: /^Finish anyway$/i }).click();
  await expect(page.getByText(/workout (complete|completed|finished)/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.goto("/workout?tab=history");
  await page.reload();
  await expect(page.getByRole("tab", { name: "History", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/no completed workouts yet/i)).toHaveCount(0);
  const downloadReady = page.waitForEvent("download");
  await page.getByRole("button", { name: /export json/i }).click();
  const download = await downloadReady;
  const report = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(report.summary.workoutCount).toBe(1);
  expect(report.workouts[0].exercises[0].sets[0]).toMatchObject({
    weight: 72.5, reps: 9, completed: true,
  });
});

test("activating a waiting service worker preserves the active workout draft", async ({ page, context }) => {
  await startWorkout(page);
  await logFirstSet(page, "65", "7");
  // A new script URL installs a real waiting worker without a second app build.
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/serwist/sw.js?update-smoke=1", {
      scope: "/", updateViaCache: "none",
    });
  });
  const reload = page.getByRole("button", { name: "Reload", exact: true });
  await expect(reload).toBeVisible();
  await Promise.all([page.waitForEvent("domcontentloaded"), reload.click()]);
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes("update-smoke=1"));
  await expect(page.getByRole("textbox", { name: /set 1 weight/i }).first()).toHaveValue("65");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /set 1 reps/i }).first()).toHaveValue("7");
  await expect(page.getByRole("button", { name: /complete set 1/i }).first()).toHaveAttribute("aria-pressed", "true");
});
