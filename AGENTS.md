<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

FitFlow is a single Next.js 16 (App Router, Turbopack) offline-first PWA. npm + Node 22. The app is fully usable with **no database**: IndexedDB (Dexie) is the source of truth and the exercise catalog ships as static JSON in `public/exercises/`. Standard commands live in `package.json` scripts and `README.md`/`docs/`.

- **Run (the only service):** `npm run dev` (port 3000). Reaching it confirms the env works — no `DATABASE_URL` needed for dev/lint/unit/e2e.
- **`DATABASE_URL` is optional** — `/api/sync` is disabled without it and Neon is initialized lazily. Local development, build, unit tests and offline e2e need no database. Setting it enables sync in development and production without authentication. See README for setup and migrations.
- **`npm run build` works without `DATABASE_URL`.** `npm run test:e2e:offline` then starts the production build on port 3200 and verifies real service-worker behavior with database access disabled.
- **Two `next dev` instances can't run for the same project.** `npm run test:e2e` auto-starts its own dev server on port 3100, but Next 16 refuses to boot it while a manual `npm run dev` (port 3000) is running ("Another next dev server is already running"). Stop the dev server before running e2e, then restart it.
- **Lint:** `npm run lint` checks the full project. Keep it free of errors and warnings; do not disable rules globally to hide failures.
- **e2e needs the Chromium binary:** `npx playwright install --with-deps chromium` (already covered by the startup update script). CI installs the same binary but caches `~/.cache/ms-playwright` keyed on the Playwright version, so it only downloads on a version bump. `PW_CHANNEL` can point the run at a different browser locally — see the header comment in `playwright.config.ts`.
