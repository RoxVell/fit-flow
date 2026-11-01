import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, waitForSeed } from "../fixtures/base";

// Midnight has already passed in UTC, but it is still January 1 locally.
test.use({ timezoneId: "Pacific/Honolulu" });

test("a cached form uses the client's local date without hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.clock.install({ time: new Date("2040-01-02T05:30:00.000Z") });
  await page.goto("/progress/body/log");

  const dateButton = page.getByRole("button", { name: /Jan 1, 2040/ });
  await expect(dateButton).toBeVisible();
  expect(errors.filter((message) => /hydrat|#418|didn't match/i.test(message))).toEqual([]);

  // A manually chosen date must survive subsequent form edits and be saved.
  await dateButton.click();
  await page.getByRole("button", { name: /January 5/ }).click();
  await page.getByRole("spinbutton", { name: /^Weight \(kg\)$/i }).fill("81.4");
  await expect(page.getByRole("button", { name: /Jan 5, 2040/ })).toBeVisible();
  await page.getByRole("button", { name: /^Save$/i }).click();
  await expect(page).toHaveURL(/\/progress\?tab=body$/);

  const saved = await page.evaluate(() => new Promise<{ date: string; weight: number }>((resolve, reject) => {
    const request = indexedDB.open("fitflow_v2");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const read = database.transaction("bodyMeasurements").objectStore("bodyMeasurements").getAll();
      read.onsuccess = () => { database.close(); resolve(read.result[0]); };
      read.onerror = () => { database.close(); reject(read.error); };
    };
  }));
  expect(saved.weight).toBe(81.4);
  expect(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Honolulu", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(saved.date))).toBe("2040-01-05");
});

type VideoDetail = {
  name: { en: string };
  videoDarkUrl: string;
  videoLightUrl: string;
};
const details = JSON.parse(readFileSync(join(process.cwd(), "public/exercises/details/LEGS.json"), "utf8")) as Record<string, VideoDetail>;
const exercise = Object.values(details).find((detail) => detail.name.en === "Jefferson Curl")!;

for (const scenario of [
  { theme: "dark", device: "light", expected: "dark" },
  { theme: "light", device: "dark", expected: "light" },
  { theme: "system", device: "dark", expected: "dark" },
] as const) {
  test(`video starts in ${scenario.expected} for ${scenario.theme} theme on a ${scenario.device} device`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scenario.device });
    await page.addInitScript((theme) => localStorage.setItem("theme", theme), scenario.theme);
    const requests: string[] = [];
    await page.route("**/asset/video/**", async (route) => {
      requests.push(route.request().url());
      await route.abort();
    });
    await page.goto("/dashboard");
    await waitForSeed(page);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scenario.expected}\\b`));
    await page.goto("/programs/library");
    await page.getByRole("tab", { name: /^Exercises$/i }).click();
    await page.getByPlaceholder(/search exercises/i).fill(exercise.name.en);
    await page.getByRole("button", { name: exercise.name.en }).click();

    // Wait for the rejected source to reach the normal poster fallback.
    await expect(page.getByRole("dialog").getByRole("img", { name: exercise.name.en })).toBeVisible();
    const expected = scenario.expected === "dark" ? exercise.videoDarkUrl : exercise.videoLightUrl;
    expect([...new Set(requests)]).toEqual([expected]);

    if (scenario.theme === "system") {
      await page.emulateMedia({ colorScheme: "light" });
      await expect.poll(() => [...new Set(requests)]).toEqual([exercise.videoDarkUrl, exercise.videoLightUrl]);
    }
  });
}
