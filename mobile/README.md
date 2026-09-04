# FitFlow Mobile (Expo)

Native iOS-first port of the FitFlow PWA (the Next.js app at the repo root).
Expo SDK 57, Expo Router, native UIKit tab bar and stack headers
(Liquid Glass on iOS 26), `expo-glass-effect` for custom glass surfaces.

## Status

First iteration: app shell only.

- Bottom tab bar with the same five tabs as the web app (Dashboard, Workout,
  Programs, Progress, Settings), SF Symbols icons, orange tint, dot badge on
  Workout when a session is active (stubbed in `src/lib/workout`).
- Each tab is its own native stack with a large-title header.
- Settings screen is a native SwiftUI `Form` (`@expo/ui`): theme
  (System/Light/Dark) and language (EN/RU) as menu pickers, plus app version.
  Preferences persist in `expo-sqlite/kv-store` (`src/lib/settings`); the
  theme is applied through `Appearance.setColorScheme`, so native bars and
  controls follow it. Language defaults to the device locale.
- Strings live in `src/lib/i18n/domains/*.ts` (subsets of the web app's
  messages), merged in `src/lib/i18n/messages.ts`.
- Local storage: expo-sqlite (`src/lib/db/database.ts`), document-style
  tables mirroring the web app's Dexie stores (JSON `data` column plus indexed
  columns), synchronous queries, seeded with the same PPL and Upper/Lower
  programs on first launch. `useLiveQuery` re-runs a query on table changes.
  Domain types and seeds are copied verbatim from the web app's `src/lib/db`.
- Exercise catalog: bundled copy of `public/exercises/manifest.json`
  (`npm run sync:exercises` refreshes it); details/videos are not bundled yet.
- Programs tab: list of programs with sessions and exercise chips, set active
  (radio), delete via native action sheet + alert. Segmented Programs/Exercises
  control is a SwiftUI picker.
- Light/dark palette derived from the web app's tokens in
  `src/constants/theme.ts`.
- Other screens are placeholders.

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
src/app/_layout.tsx          root stack (tabs + future full-screen flows)
src/app/(tabs)/_layout.tsx   NativeTabs
src/app/(tabs)/<tab>/        per-tab stack + index screen
src/components/              Screen, Card, Placeholder, GlassButton, TabStack
src/constants/theme.ts       colors, spacing, radius, fonts
src/lib/i18n/                messages (per-domain files), useT/useLocale
src/lib/settings/            persisted preferences (theme, locale)
src/lib/db/                  sqlite schema, seeds, domain types, useLiveQuery
src/lib/repositories/        sync data access per entity
src/lib/exercises/           bundled catalog access
src/data/exercises/          manifest.json copied from the web app
```

## Next

- Share `src/lib` domain code (i18n, metrics, exercise catalog) with the web
  app via Metro `watchFolders`.
- Replace the template icon/splash assets.
- Program editor, exercise details/videos, sync layer (outbox) once a backend exists.
