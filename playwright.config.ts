import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for FitFlow e2e tests.
 *
 * The app is a mobile-first PWA backed by IndexedDB. We:
 *  - Boot the Next.js dev server on a dedicated port.
 *  - Use a Pixel-5-class viewport to match the production layout.
 *  - Block the Serwist service-worker route so a stale build can never
 *    cache into a test run.
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
        channel: "chromium",
      },
    },
  ],

  webServer: {
    command: `next dev --port ${PORT} --hostname 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
