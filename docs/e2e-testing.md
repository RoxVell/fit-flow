# E2E testing

FitFlow's e2e suite is built on [Playwright](https://playwright.dev/) and
runs against the live Next.js dev server. The goal is to verify the
critical user flows (navigation, workout logging, settings, programs,
progress) end-to-end — including the IndexedDB-backed data layer, the
PWA service worker, and the i18n toggle.

## Quick start

```bash
# 1. Install dependencies (one-time).
npm install

# 2. Install the Chromium browser binary (one-time).
npx playwright install chromium

# 3. Run the full suite headlessly.
npm run test:e2e

# 4. Watch the suite run in a real browser.
npm run test:e2e:headed

# 5. Step through tests with the Playwright inspector.
npm run test:e2e:ui

# 6. Open the last HTML report.
npm run test:e2e:report
```

The first run will take longer because the dev server has to compile
the Next.js app on demand. Subsequent runs reuse the existing server
(`reuseExistingServer: true` in `playwright.config.ts`).

## Suite layout

```
e2e/
  fixtures/
    base.ts                 # shared `test`, `expect`, seed/IDB helpers
  tests/
    01-navigation.spec.ts   # root redirect, bottom nav, dashboard CTA
    02-workout-flow.spec.ts # workout plan, change-day, log + finish
    03-settings.spec.ts     # theme + language controls, locale persistence
    04-programs.spec.ts     # library tabs, create form, seeded PPL program
    05-progress.spec.ts     # general / exercises / body tabs
playwright.config.ts        # dev-server config, mobile viewport, SW block
```

Each spec uses the shared `test` from `e2e/fixtures/base.ts`, which:

- Strips the `fitflow-locale` cookie on every page load so the suite
  always boots in English (the default).
- Stubs `navigator.serviceWorker.register` so the Serwist SW can never
  cache a stale build into a test run.

Each test calls `waitForSeed(page)` after the first navigation. The
helper blocks until `fitflow_v2.programs` in IndexedDB is non-empty,
which means the seed bootstrap (`ensureSeeded()`) has finished and the
`PPL` program is available.

## Test philosophy

Tests target **user-visible behavior**, not implementation details:

- **Locators** prefer `getByRole` / `getByText` over CSS classes so the
  suite survives refactors of Tailwind / ShadCN class names.
- **Localised strings** are matched with case-insensitive regex (e.g.
  `/start workout/i`) so the same test continues to pass when the
  active locale flips to Russian — the regexes are intentionally broad
  on purpose.
- **No hard-coded IDs**: tests do not depend on specific exercise or
  session IDs from the seed data.

## Configuring the test environment

| Env var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3100` | Port the dev server binds to. |
| `CI` | unset | When set, the reporter switches to `github`, retries twice, and serializes workers. |

The dev server is started automatically by Playwright
(`webServer.command`). To run tests against an already-running dev
server, start it yourself on the same port and Playwright will reuse
the connection.

## Common patterns

### Resetting IndexedDB between tests

```ts
import { test, clearIndexedDb } from "../fixtures/base";

test("fresh install flow", async ({ page }) => {
  await page.goto("/dashboard");
  await clearIndexedDb(page);
  await page.reload();
});
```

### Asserting on a localiased label

```ts
// English "Workout" or Russian "Тренировка" — both match.
await expect(page.getByRole("heading", { name: /workout|тренировка/i })).toBeVisible();
```

## Debugging failures

When a test fails, Playwright retains the trace, video, and screenshot
under `test-results/<spec>-<test>-<browser>/`. Open the trace to
inspect network traffic, console output, and a step-by-step DOM
snapshot:

```bash
npx playwright show-trace test-results/02-workout-flow-user-can-start-a-workout-chromium/trace.zip
```

You can also rerun a single spec with the `--headed` flag to watch
the browser:

```bash
npm run test:e2e:headed -- e2e/tests/02-workout-flow.spec.ts
```

## Adding a new test

1. Pick a `*.spec.ts` file that matches the area, or create a new one
   with a `NN-name.spec.ts` prefix.
2. Import `test`, `expect`, and any helpers from `../fixtures/base`.
3. Add a `test.beforeEach` that navigates to the page under test and
   calls `waitForSeed(page)` if the page depends on the seeded program.
4. Use `getByRole` / `getByText` locators — avoid CSS class selectors.
5. Keep the test focused: one assertion per flow. Split multi-step
   journeys into separate `test()` calls so failures are easy to
   attribute.

## CI

The repo ships a GitHub Actions workflow at
[`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml)
that runs the suite on every push to `main` and on every pull request
targeting `main`. It uses `ubuntu-latest`, Node 22, and `npm ci` to
install from the lockfile. Playwright artifacts (`playwright-report/`
and `test-results/`) are uploaded automatically on failure with a
7-day retention. `process.env.CI` is set, so the config flips to the
`github` reporter, retries twice, and serializes workers.
