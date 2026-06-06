# Exercise Library & i18n

## Overview

FitFlow ships a static, bilingual exercise catalog (~800 exercises) and UI strings in **English** and **Russian**. Exercise metadata lives in committed JSON under `public/exercises/`; UI copy lives in `src/lib/i18n/messages.ts`. Programs and workout logs store **exercise UUIDs** only — names are resolved at runtime from the manifest.

```
data/raw/ (local, gitignored)
    ↓ npm run build:exercises
public/exercises/
    ↓ fetch (manifest + body-part chunks)
useExerciseManifest / useExerciseLibrary / useExerciseDetail
    ↓ pickLocalized(name, locale)
React UI
```

## Building the library

### Sources

| File | Purpose |
|------|---------|
| `data/raw/exercise-library.json` | English SmartWorkout dump |
| `data/raw/biblioteka-uprazhneniy.json` | Russian dump (matched by `id`) |

Override paths with env vars `EXERCISE_EN` and `EXERCISE_RU`.

`data/raw/` is **gitignored**. CI/Vercel use the committed output in `public/exercises/`.

### Command

```bash
npm run build:exercises
```

The script (`scripts/build-exercise-library.ts`):

1. Loads EN + RU JSON arrays from `pageProps.exercises`
2. Merges localized fields per exercise `id` (EN from EN file, RU from RU file)
3. Writes `public/exercises/manifest.json` (lightweight list for browse/filter)
4. Writes `public/exercises/details/{BODY_PART}.json` (full detail per chunk)
5. Writes `public/exercises/meta.json` (`builtAt`, `count`, `bodyParts`)

If sources are missing but `manifest.json` exists, the script exits successfully (Vercel `next build` path).

`npm run build` runs **only** `next build` — regenerate the library locally when sources change, then commit `public/exercises/`.

### Output shape

**Manifest item** (browse card):

```ts
{
  id: string;           // UUID
  name: { en, ru };
  bodyPart: BodyPart;
  equipments: string[];
  mechanics: "COMPOUND" | "ISOLATION";
  laterality: string;
  weightType: string;
  tags: string[];
  thumbnailUri: string | null;
  muscleWeights?: Partial<Record<MuscleGroup, number>>; // max % per group, from exerciseMuscles at build time
}
```

`muscleWeights` is computed in `scripts/build-exercise-library.ts` via `muscleWeightsFromLibrary()` (`src/lib/exercises/muscle-map.ts`). The dashboard heatmap (`useDashboardStats`) adds `(percent / 100) × completedSets` per group — e.g. leg curl counts toward hamstrings, glutes, and calves, not only quads.

**Detail** adds `description`, `instructions`, `tips`, `commonMistakes`, media URLs, and `exerciseMuscles`.

## Runtime loading

### Client (`src/lib/exercises/library-client.ts`)

| URL | Cached |
|-----|--------|
| `/exercises/manifest.json` | In-memory promise (session) |
| `/exercises/details/{BODY_PART}.json` | Per body-part promise |
| `/exercises/meta.json` | In-memory promise |

### Service Worker (`src/app/sw.ts`)

`/exercises/*` uses **CacheFirst** (`exercise-library` cache, 30 days). After the first online visit, manifest and detail chunks work offline. On each new SW `activate`, the `exercise-library` cache is deleted so redeploys pick up rebuilt JSON; in-memory client cache is cleared via `clearExerciseLibraryCache()` in `ServiceWorkerRegister`.

Thumbnail images (`api.smartworkout.app`) stay **NetworkOnly** — offline list shows a Dumbbell placeholder via `ExerciseThumbnail` `onError` fallback.

### Hooks

| Hook | Role |
|------|------|
| `useExerciseManifest()` | Loads manifest once; module-level cache |
| `useExerciseLibrary(filters?)` | Filtered manifest for list UI |
| `useExerciseDetail(id)` | Lazy-loads body-part chunk when id is set |
| `useExerciseName(id)` | Localized name string |
| `useExerciseLookup()` | `getName` / `getExercise` for programs & logs |

Program hooks (`usePrograms`, `useActiveProgram`, `useProgram`) wait for manifest (`undefined` while loading), then attach resolved `exercise` objects to session rows via `buildExerciseMapFromManifest`.

### UI components

- `ExerciseLibraryList` — virtualized list, filters, opens detail sheet
- `ExerciseDetailSheet` — fullscreen dialog: video, muscles, instructions/tips/mistakes tabs
- `ExerciseVideo` — theme-aware dark/light video URLs
- `ExerciseThumbnail` — native `<img>` with Dumbbell placeholder when `src` is missing or load fails

## Programs & data migration

Seed programs reference fixed UUIDs in `src/lib/db/seed-exercise-ids.ts` (derived from manifest).

**Dexie schema v3** (`src/lib/db/seed-loader.ts`):

- On schema upgrade, clears `exercises`, `workoutLogs`, `personalRecords`, `workoutDrafts`, `programs` and re-seeds default programs with library UUIDs

The `exercises` Dexie store is unused for the catalog; exercises are resolved from the static manifest.

## i18n (UI strings)

### Messages

`src/lib/i18n/messages.ts` — nested `en` / `ru` objects. Access via:

```ts
const t = useT();        // getMessages(locale)
t.dashboard.greetings.morning("Anton")
```

### Locale storage

| Layer | Mechanism |
|-------|-----------|
| Server | Cookie `fitflow-locale` + `Accept-Language` → `lang` on `<html>` |
| Bootstrap | Inline `<head>` script syncs localStorage → cookie before React |
| Client | `LocaleProvider` (React Context) in `src/lib/i18n/locale-context.tsx` |
| Persist | Cookie + localStorage (`fitflow-locale`) |

`useLocale()` / `useSetLocale()` — prefer `@/lib/i18n/locale-context` (re-exported from deprecated `@/lib/stores/locale-store`).

`LanguageToggle` in Settings calls `setLocale("en" | "ru")`.

### Formatting

`src/lib/i18n/format.ts` — pure functions `(value, locale)`.

`useFormat()` wraps them with `useCallback` keyed on `locale` so `useMemo` deps stay stable:

```ts
const { formatChartDate, dayLabels, muscleGroupLabel } = useFormat();
```

Use `locale` (not formatter functions) as a `useMemo` dependency if calling `format.ts` directly.

Exercise names use `pickLocalized(field, locale)` from `src/lib/exercises/locale.ts`, not `messages.ts`.

## Key files

| Path | Role |
|------|------|
| `scripts/build-exercise-library.ts` | EN+RU merge build |
| `public/exercises/` | Committed static catalog |
| `src/lib/exercises/*` | Types, filter, labels, adapter, client |
| `src/lib/hooks/use-exercise-library.ts` | Manifest/library/detail hooks |
| `src/lib/hooks/use-exercise-lookup.ts` | Name resolution for logs/programs |
| `src/lib/i18n/messages.ts` | UI copy EN/RU |
| `src/lib/i18n/locale-context.tsx` | Locale React context |
| `src/lib/i18n/locale-cookie.ts` | Cookie/localStorage/bootstrap script |
| `src/lib/i18n/use-format.ts` | Memoized date/label formatters |
| `src/app/layout.tsx` | Server locale + bootstrap script |
| `src/app/sw.ts` | Offline cache for `/exercises/` |

## Development checklist

1. Place raw JSON in `data/raw/` (or set `EXERCISE_EN` / `EXERCISE_RU`)
2. `npm run build:exercises`
3. Commit updated `public/exercises/` if output changed
4. `npm run dev` — library loads from `/exercises/manifest.json`
5. Toggle language in Settings; verify no hydration flash on reload
6. Test offline: load app online once, then DevTools → Offline → open Programs → Exercises tab
