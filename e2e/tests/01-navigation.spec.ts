import { test, expect } from "../fixtures/base";

test("root URL redirects to dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/Anton/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /start workout/i })).toHaveCount(0);
});

test("bottom nav links route to every primary screen", async ({ page }) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation");
  await expect(nav).toBeVisible();

  await nav.getByRole("link", { name: /^Workout$/i }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole("heading", { name: /^Workout$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Programs$/i }).click();
  await expect(page).toHaveURL(/\/programs\/library$/);
  await expect(page.getByRole("heading", { name: /^Programs$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Progress$/i }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole("heading", { name: /^Progress$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Settings$/i }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: /^Settings$/i })).toBeVisible();

  await nav.getByRole("link", { name: /^Dashboard$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("dismissing the system install prompt hides its consumed offer", async ({ page }) => {
  await page.goto("/dashboard");
  const dialog = page.getByRole("dialog", { name: "Install FitFlow" });
  const install = dialog.getByRole("button", { name: "Install", exact: true });
  const offer = () => page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => { window.dispatchEvent(new Event("install-prompt-opened")); },
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    });
    return !window.dispatchEvent(event);
  });
  // The listener is installed after hydration.
  await expect.poll(offer).toBe(true);
  await Promise.all([
    page.evaluate(() => new Promise<void>((resolve) => {
      window.addEventListener("install-prompt-opened", () => resolve(), { once: true });
    })),
    install.click(),
  ]);
  await expect(install).toBeHidden();
  expect(await offer()).toBe(true);
  await expect(install).toBeVisible();
});
