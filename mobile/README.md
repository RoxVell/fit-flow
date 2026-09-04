# FitFlow Mobile (Expo)

Native iOS-first port of the FitFlow PWA (the Next.js app at the repo root).
Expo SDK 57, Expo Router, native UIKit tab bar and stack headers
(Liquid Glass on iOS 26), `expo-glass-effect` for custom glass surfaces.

## Status

Feature parity with the PWA is in progress. Implemented:

- Bottom tab bar with the same five tabs as the web app (Dashboard, Workout,
  Programs, Progress, Settings), SF Symbols icons, orange tint, dot badge on
  Workout when a session is active.
- Each tab is its own native stack with a large-title header.
- Settings: theme (System/Light/Dark) and language (EN/RU), persisted in
  `expo-sqlite/kv-store`. Theme follows `Appearance.setColorScheme`.
- Local storage: expo-sqlite tables mirroring the web Dexie stores, seeded with
  the same PPL and Upper/Lower programs.
- Dashboard: greeting, stats grid, general progress chart, recent PRs and
  workouts. Weight tile opens the body-measurement log.
- Workout plan, continue/discard draft, **active session logging** (weight/reps,
  complete, add/remove sets, notes, deload, swap/add/remove exercise, rest
  timer, pause, finish → history + PRs + triumph), in-session exercise history,
  workout history with edit/delete/CSV export, cardio log.
- Programs: list, set active, delete, create/edit with sessions and rest
  duration, exercise library (usage-sorted) and detail (instructions + video).
- Progress: General / Exercises / Body tabs, charts, measurement log, weekly
  muscle heatmap (anterior/posterior silhouette).
- Cloud sync client: outbox queue, `POST /api/sync` (same protocol as the PWA),
  last-sync time in Settings. Point `EXPO_PUBLIC_SYNC_URL` at the web app
  (defaults to `http://localhost:3000/api/sync`). Sync is optional — without a
  live API the app stays fully usable offline.

## Run

```bash
cd mobile
npm install
npm run ios        # needs Xcode + iOS simulator
npm run typecheck
npm run doctor
```

Native tabs, native stack headers and glass effects require a development
build, not Expo Go:

```bash
npx expo run:ios
```

## Layout

```
src/app/_layout.tsx          root stack (tabs + full-screen flows)
src/app/index.tsx            redirects `/` to Dashboard
src/app/(tabs)/              NativeTabs + per-tab stacks
src/app/workout/             active session, add-exercise, cardio
src/app/programs/(editor)/   program create/edit modal
src/components/              Screen, Card, tab/workout/progress UI
src/constants/theme.ts       colors, spacing, radius, fonts
src/lib/i18n/                messages (per-domain files), useT/useLocale
src/lib/settings/            persisted preferences (theme, locale)
src/lib/db/                  sqlite schema, seeds, domain types, useLiveQuery
src/lib/repositories/        sync data access per entity
src/lib/exercises/           bundled catalog access
src/data/exercises/          manifest.json copied from the web app
```
