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
 * Both locally and in CI this runs Playwright's own browser, which
 * resolves to the `chrome-headless-shell` build. CI does not download it
 * per run — the workflow caches ~/.cache/ms-playwright keyed on the
 * Playwright version. A system Chrome (`channel: "chrome"`) was measured
 * as an alternative and rejected: it removes the download but runs the
 * suite ~45s slower on the runner, which more than cancels the saving.
 *
 * `PW_CHANNEL` remains as a local escape hatch for reproducing a
 * browser-specific failure — `PW_CHANNEL=chrome npm run test:e2e -- --workers=1`
 * for the runner's Chrome, `chromium` for the full (non-shell) build.
 * Pass `--workers=1`: on macOS, parallel workers driving the *system*
 * Chrome pass their tests but then sit through the full 5-minute
 * shutdown grace period before being force-killed.
 *
 * Note the channel does not change process sandboxing: Playwright
 * launches all three of the default headless shell, `channel: "chromium"`
 * and `channel: "chrome"` with `--no-sandbox` (verify with
 * `DEBUG=pw:browser`).
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