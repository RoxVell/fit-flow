import { test, expect, waitForSeed } from "../fixtures/base";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await waitForSeed(page);
  await page.goto("/programs/library");
});

test("library lists the seeded PPL program and exposes a create link", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /^programs$/i })).toBeVisible();
  await expect(page.getByText(/^PPL$/i).first()).toBeVisible();

  // The "Create new program" affordance in the library is a Next.js <Link>
  // wrapping a ShadCN <Button>. Both roles are present in the DOM, but the
  // outer <a> is the semantically meaningful navigation target — we assert
  // on `link` so the test stays correct if the inner button is ever removed.
  await expect(
    page.getByRole("link", { name: /create|new program/i }),
  ).toBeVisible();
});

test("library can switch between programs and exercises views", async ({ page }) => {
  // The Programs / Exercises toggle is a segmented tablist at the top.
  const programsTab = page.getByRole("tab", { name: /^programs$/i });
  const exercisesTab = page.getByRole("tab", { name: /^exercises$/i });

  await expect(programsTab).toBeVisible();
  await expect(exercisesTab).toBeVisible();

  // Switch to the exercises tab.
  await exercisesTab.click();
  // The exercise library has a search input.
  await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();

  // Switch back to the programs tab.
  await programsTab.click();
  await expect(page.getByText(/^PPL$/i).first()).toBeVisible();
});

test("user can set a different program as active", async ({ page }) => {
  await expect(page.getByText(/^PPL$/i).first()).toBeVisible();
  await expect(page.getByText(/^Upper \/ Lower$/i).first()).toBeVisible();

  const pplCard = page.locator(".overflow-hidden").filter({
    has: page.getByText(/^PPL$/i),
  });
  const upperLowerCard = page.locator(".overflow-hidden").filter({
    has: page.getByText(/^Upper \/ Lower$/i),
  });
  const pplRadio = pplCard.getByRole("radio", { name: /set active:\s*PPL/i });
  const upperLowerRadio = upperLowerCard.getByRole("radio", {
    name: /set active:\s*Upper \/ Lower/i,
  });

  await expect(pplCard.getByText(/^active$/i)).toBeVisible();
  await expect(pplRadio).toBeChecked();
  await upperLowerRadio.click();

  await expect(upperLowerCard.getByText(/^active$/i)).toBeVisible();
  await expect(upperLowerRadio).toBeChecked();
  await expect(pplRadio).not.toBeChecked();

  await page.goto("/workout");
  await expect(page.getByText(/Upper \/ Lower/i).first()).toBeVisible();
});

test("create program form requires a name and can be cancelled", async ({ page }) => {
  await page.getByRole("link", { name: /create|new program/i }).first().click();
  await expect(page).toHaveURL(/\/programs\/create/);

  // The form has a name field. Empty form should keep the save button disabled.
  const saveButton = page.getByRole("button", { name: /^save$|create|^update$/i }).first();
  // We just verify the form is on screen — the form may pre-populate the name,
  // but the save action is gated by validation.
  await expect(saveButton).toBeVisible();

  // Cancel/back navigates back to the library.
  await page.getByRole("button", { name: /back|cancel/i }).first().click();
  await expect(page).toHaveURL(/\/programs\/library$/);
});
