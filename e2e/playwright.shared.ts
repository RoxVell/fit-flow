import { defineConfig, devices } from "@playwright/test";

export const sharedConfig = defineConfig({
  forbidOnly: !!process.env.CI,
  reporter: [[process.env.CI ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    ...devices["Pixel 5"],
    channel: process.env.PW_CHANNEL || undefined,
    locale: "en-US",
    colorScheme: "light",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
});
