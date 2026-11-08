import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.OFFLINE_PORT ?? 3200);
const baseURL = `http://127.0.0.1:${port}`;

// Build first. This suite exercises the installed production worker, without
// the SW and API stubs used by the ordinary development-server suite.
export default defineConfig({
  testDir: "./e2e/offline",
  outputDir: "test-results/offline",
  forbidOnly: !!process.env.CI,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Pixel 5"],
    channel: process.env.PW_CHANNEL || undefined,
    baseURL,
    locale: "en-US",
    colorScheme: "light",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: `next start --port ${port} --hostname 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    // Exercise the supported local-only mode even if .env.local has a DB.
    env: { ...process.env, DATABASE_URL: "" },
    stdout: "ignore",
    stderr: "pipe",
  },
});
