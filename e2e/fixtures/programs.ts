import { type Page } from "@playwright/test";

/**
 * The library card for a single program.
 *
 * Anchoring on the `Set active: <name>` radio is what makes this precise.
 * Scoping by `.overflow-hidden` instead also matches ancestors that wrap
 * *every* card, so a per-card assertion silently widens to the whole
 * list. That is not theoretical: while a program is being activated the
 * library renders an "Active" badge on both the outgoing and incoming
 * card (`prog.isActive || activatingId === prog.id`), so a widened
 * locator hits a strict-mode violation on two badges — but only when the
 * browser happens to sample that window.
 */
export function programCard(page: Page, name: string) {
  return page.locator('[data-slot="card"]').filter({
    has: page.getByRole("radio", { name: `Set active: ${name}` }),
  });
}
