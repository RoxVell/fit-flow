import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for FitFlow e2e tests.
 *
 * The app is a mobile-first PWA backed by IndexedDB. We:
 *  - Boot the Next.js dev server on a dedicated port.
 *  - Use a Pixel-5-class viewport to match the production layout.
 *  - Block the Serwist service-worker route so a stale build can never
 *    cache into a test run.
 *
 * `channel` is intentionally omitted — Playwright's default uses the
 * bundled chromium with the sandbox enabled. The previous
 * `channel: "chromium"` value resolved to the same binary but with
 * the sandbox disabled, which weakens isolation on developer
 * machines for no gain.
 */
const PORT = Number(process.env.PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],

  webServer: {
    command: `next dev --port ${PORT} --hostname 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Set PWTEST=1 so next.config.ts can flip off the on-screen dev
    // indicator (which renders at bottom-left and covers the first nav
    // link, breaking clicks in local test runs). CI already gets
    // devIndicators: false via process.env.CI, but local `npm run
    // test:e2e` runs don't have CI set.
    env: { ...process.env, PWTEST: "1" },
    stdout: "ignore",
    stderr: "pipe",
  },
});