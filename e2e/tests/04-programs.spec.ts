import { test, expect } from "../fixtures/base";
import { programCard } from "../fixtures/programs";

test.beforeEach(async ({ page }) => {
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

  const pplCard = programCard(page, "PPL");
  const upperLowerCard = programCard(page, "Upper / Lower");
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

test("create program form starts disabled and can be cancelled", async ({ page }) => {
  await page.getByRole("link", { name: /create|new program/i }).first().click();
  await expect(page).toHaveURL(/\/programs\/create/);

  await expect(page.getByPlaceholder(/push\/pull\/legs/i)).toHaveValue("");
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();

  // Cancel/back navigates back to the library.
  await page.getByRole("button", { name: /back|cancel/i }).first().click();
  await expect(page).toHaveURL(/\/programs\/library$/);
});
