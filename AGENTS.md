<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

FitFlow is a single Next.js 16 (App Router, Turbopack) offline-first PWA. npm + Node 22. The app is fully usable with **no database**: IndexedDB (Dexie) is the source of truth and the exercise catalog ships as static JSON in `public/exercises/`. Standard commands live in `package.json` scripts and `README.md`/`docs/`.

- **Run (the only service):** `npm run dev` (port 3000). Reaching it confirms the env works — no `DATABASE_URL` needed for dev/lint/unit/e2e.
- **`DATABASE_URL` is optional** — only the `/api/sync` route, `db:push`/`db:generate`, and the boostcamp import touch Neon Postgres. Without it, `SyncProvider` logs a non-blocking `neon()` "No database connection string" error on each sync attempt; the UI keeps working. Set it in `.env.local` only if testing cross-device sync.
- **`npm run build` requires `DATABASE_URL` to be *present*** (not a live DB). Page-data collection imports `/api/sync`, and `neon()` throws at import if the var is unset. A placeholder works: `DATABASE_URL="postgresql://user:pass@localhost:5432/db" npm run build`.
- **Two `next dev` instances can't run for the same project.** `npm run test:e2e` auto-starts its own dev server on port 3100, but Next 16 refuses to boot it while a manual `npm run dev` (port 3000) is running ("Another next dev server is already running"). Stop the dev server before running e2e, then restart it.
- **Lint currently fails** (`npm run lint` exits 1) due to pre-existing errors in tracked files (mostly `react-hooks` rules in `src/lib/i18n/locale-context.tsx` and others). This is the repo's baseline, not an env problem.
- **e2e needs the Chromium binary:** `npx playwright install --with-deps chromium` (already covered by the startup update script). CI skips that download instead and runs against the runner's preinstalled Google Chrome via `PW_CHANNEL=chrome`; locally that variable is unset, so nothing changes. See the header comment in `playwright.config.ts` before setting it by hand.
