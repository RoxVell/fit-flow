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
 * Browser selection is driven by `PW_CHANNEL`:
 *
 *  - unset (local default) — Playwright's own download, so a fresh
 *    checkout needs no system browser.
 *  - `chrome` (set by CI) — the Google Chrome already present on the
 *    GitHub Actions runner at /usr/bin/google-chrome, which lets the
 *    workflow skip the ~170 MB `playwright install` download entirely.
 *
 * Set it locally too (`PW_CHANNEL=chrome npm run test:e2e --workers=1`)
 * to reproduce a CI-only failure on the same browser build. Pass
 * `--workers=1` there: on macOS, parallel workers driving the system
 * Chrome pass their tests but then sit for the full 5-minute shutdown
 * grace period before being force-killed. CI is unaffected because it
 * already runs single-worker (see `workers` below), and single-worker
 * runtime is the same on both browsers.
 *
 * The channel does not change process sandboxing: Playwright launches
 * all three of the default headless shell, `channel: "chromium"` and
 * `channel: "chrome"` with `--no-sandbox` (verify with
 * `DEBUG=pw:browser`). The real trade-off is version drift — the
 * runner's Chrome is a moving stable release rather than the build
 * pinned by our Playwright version, so a Chrome update can break CI
 * without a commit. The workflow prints the version for that reason.
 */
const PORT = Number(process.env.PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHANNEL = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    // Pin light mode so next-themes "system" default is deterministic.
    colorScheme: "light",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: CHANNEL ?? "chromium",
      use: {
        ...devices["Pixel 5"],
        channel: CHANNEL,
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