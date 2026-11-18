# FitFlow

Mobile-first fitness tracking PWA. IndexedDB stores workouts locally. React components subscribe through Dexie live queries. The optional sync API exchanges changes with PostgreSQL when configured.

## Language

**repository**:
A module in `src/lib/repositories/` that reads and writes a domain resource. Changes to synced entities and their queue entries commit together in IndexedDB.

**sync queue**:
The `syncQueue` table stores pending creates, updates and deletes. The sync runner uploads them to `/api/sync`, acknowledges accepted or superseded changes and applies the server's snapshot.

**seeded read**:
A read that requires the default program to exist. `ensureSeeded()` initializes an empty local database. The exercise catalog is served separately from `public/exercises/`.

**active program**:
The single `WorkoutProgram` marked `isActive: true` in IndexedDB. Drives the Workout plan tab, rest duration, and session picker. Exactly one program is active at a time; the user switches it from Programs → library via **Set active**. Editing a program does not change which one is active.
_Avoid_: current program, selected plan, default workout

**active workout**:
The in-progress session persisted as a `WorkoutDraft` in IndexedDB. Finishing saves a `WorkoutLog` and clears its draft in the same transaction. History supports editing completed sets and deleting logs.
_Avoid_: current session, live workout, draft workout

**rest duration**:
Per-program rest timer length in seconds (`restDurationSeconds` on `WorkoutProgram`). One value applies to every exercise in that program; completing a set during an active workout starts the timer for this duration. Default 90 seconds. Edited in Program Info via a 15-second stepper (30 s–5 min).
_Avoid_: rest timer setting, break time, global timer preference

**triumph screen**:
Full-screen overlay shown immediately after finishing an active workout: duration, volume, and new PRs. Covers the bottom nav; dismissed with Done.
_Avoid_: completion modal, summary page, celebration dialog

**exercise history sheet**:
During an active workout, tapping an exercise name opens a bottom sheet (~70% viewport height) showing past performance for that exercise. Reuses the session accordion from Progress; only completed `WorkoutLog` entries, not the in-progress draft. Dismiss by tapping the dimmed area above the sheet.
_Avoid_: exercise detail, progress page, modal

**exercise library list**:
The Exercises tab under Programs shows the catalog in a single shared card container (`rounded-xl border bg-card`) with rows divided inside, rather than individual per-row cards.
_Avoid_: exercise picker, program editor list

**training metric**:
A named derivation of one or more sets: `e1RM(weight, reps)`, `volume(sets)`, `bestWeight(sets)`, `bestE1RM(sets)`. Lives in `lib/training-metrics.ts`; all four formulas are colocated there and never inlined. Callers pass a structural `{ weight, reps }` shape (e.g. a filtered `LoggedSet[]`), never the full `LoggedSet` record.
_Avoid_: stat, measurement, number

**e1RM**:
Epley-estimated one-rep max. `e1RM(weight, reps)` returns `weight` for a single rep, else `weight * (1 + reps / 30)`. The canonical strength projection of a working set; surfaced in the dashboard, exercise history, and the per-exercise progress chart. Computed only on `completed` sets.
_Avoid_: estimated 1RM, projected max, one-rep max

**personal record (PR)**:
A new best weight, volume or estimated 1RM for an exercise. `derivePersonalRecords()` derives records from completed workout history so edits, deletions and sync updates are reflected.
_Avoid_: achievement, milestone, best lift

**progress index**:
Strength progress expressed as a percentage of baseline: `(current e1RM / baseline e1RM) × 100`. Baseline is the best e1RM from the **first week that exercise appears** in history, not the app’s global first week. **100%** means “same as when you first logged this exercise.” Used on General progress, body-part charts, and per-exercise history views. See [docs/progress-charts.md](./docs/progress-charts.md).
_Avoid_: percent gain, strength score

**body part progress**:
Weekly and summary progress grouped by catalog `BodyPart`. Chart lines are period-indexed and **exclude exercises logged only once** in the period; category **change** = first vs last chart point. Component: `BodyPartProgressChart`.
_Avoid_: muscle group chart, body region stats

**chart period**:
Time window for progress charts: `1m` (30 days), `2m`, `3m`, `6m`, or `all`. Default `1m`. Defined in `lib/charts/periods.ts`; UI in `ChartPeriodSelector`.
_Avoid_: date range, zoom level

**focus domain**:
Y-axis scaling that starts below the data minimum (≈12% padding under range) instead of zero, so small progress/regression is readable on strength charts. `computeFocusDomain` in `lib/charts/domain.ts`.
_Avoid_: auto scale, zoomed axis

**body measurement snapshot**:
A single log entry capturing whatever body metrics the user measured at one moment. **Tracked body metrics** in the form: weight and circumferences — all optional individually, but **at least one field must be filled** to save. Multiple snapshots may exist on the same calendar day; charts and dashboard use a **daily body view**. No morning/evening distinction in the UI. Distinct from **training metric** (derived from workout sets).
_Avoid_: measurement (alone), body log, check-in

**daily body view**:
The merged representation of all **body measurement snapshots** on one calendar day. For each metric field, take the latest snapshot that has a value for that field (last non-null wins by snapshot time). Charts and dashboard weight trend consume daily body views, not raw snapshots.
_Avoid_: daily average, combined entry, rollup row

**body measurement log step**:
Full-screen form at `/progress/body/log` for creating a **body measurement snapshot**. Back cancels without save; Save persists and returns to **Progress → Body**. Reached from Body tab **Log** or Dashboard weight card.
_Avoid_: log modal, log sheet, measurements screen

**body measurement history**:
On **Progress → Body**, a list of raw **body measurement snapshots** (not **daily body view** rows). Each row: date + compact summary of filled fields only (e.g. `80 kg · 85 cm waist`). **Delete**: swipe left, then confirm in a dialog. **Editing** is not supported — fix via new snapshot or delete + re-log.
_Avoid_: edit measurement, update entry, daily history row

**snapshot date**:
Each **body measurement snapshot** is stamped with a user-chosen calendar date; default is today at save time. Backdating is allowed on the full form (e.g. forgot yesterday's weigh-in).
_Avoid_: logged at, timestamp, entry time

**tracked body metrics**:
Weight (kg) and circumferences (chest, waist, arms, thighs, calves — cm). **Body-fat %** is not offered in the UI for now; the field remains in storage/sync for a possible future release.
_Avoid_: body composition, fat tracking

**body progress charts**:
Weight and circumference charts on **Progress → Body** use the same **chart period** control as other Progress tabs (`1m`–`6m`, `all`; default `3m`). Data source is **daily body view**, not raw snapshots.
_Avoid_: body chart range, measurement zoom

**body tab empty state**:
When there are no snapshots yet, show chart placeholders («No measurements yet») and a **Log measurement** CTA that opens **body measurement log step**. History section hidden or empty until first snapshot.
_Avoid_: onboarding screen, hide charts

**dashboard weight card**:
Shows the latest weight from **daily body view** history; **—** with no trend arrow when no weight has ever been logged. Trend compares the two most recent days that have a weight (skip days without weight). Card is always visible and tappable → **body measurement log step**.
_Avoid_: zero placeholder, hide weight stat
