# FitFlow

Mobile-first fitness tracking PWA. All data is local — IndexedDB via `lib/db/`, no backend. TanStack Query for reads/mutations; Zustand for the active-workout session state.

## Language

**API method**:
A method-shaped function in `lib/api.ts` that reads or writes a domain resource (workout log, program, exercise, body measurement, etc.). Replaces the older URL-string transport; callers pass typed args and get typed results, not URLs and HTTP statuses.
_Avoid_: endpoint, route, transport, URL path

**op**:
A named, JSON-serializable operation registered with the outbox. Each op has a name (string) and an args array; the outbox persists both, then on flush calls the registered function with the saved args. The outbox does not know what the args mean.
_Avoid_: endpoint, request, action

**outbox**:
A generic operation-retry engine in `lib/outbox.ts`. Stores failed writes to IDB and replays them on reconnect. The outbox is the policy for "what happens when a write fails"; the API methods are the policy's only consumers.
_Avoid_: queue, sync queue, retry queue, pending requests

**queued write**:
A write that threw at the db layer and was deferred to the outbox. The caller sees `undefined` from the API method; the outbox calls `useOutboxState`'s listener set so any UI showing pending count refreshes. After a successful flush, the write is gone from the outbox and the next read sees it.
_Avoid_: failed request, pending mutation, offline write

**seeded read**:
A read against a resource that requires the seed bootstrap (`exercises`, `programs`). The `db/queries.ts` read functions call `ensureSeeded()` first; the seed is a one-time insert guarded by an IDB meta flag. The seed concern lives in the read module, not in the API or transport.
_Avoid_: initial fetch, cold start, first-run load

**active program**:
The single `WorkoutProgram` marked `isActive: true` in IndexedDB. Drives the Workout plan tab, rest duration, and session picker. Exactly one program is active at a time; the user switches it from Programs → library via **Set active**. Editing a program does not change which one is active.
_Avoid_: current program, selected plan, default workout

**active workout**:
The in-progress workout session held in the Zustand `workout-store`. Distinct from a `WorkoutLog` (which is the persisted record of a completed workout). The active workout can be edited freely; the log is created on finish and is immutable thereafter.
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
A `PersonalRecord` entry the system emits on workout finish for each completed exercise. Built by `createPRsFromWorkout(loggedExercises, exerciseMap, completedAt)` in `db/queries.ts`: for each completed exercise with `bestWeight > 0` emits a `weight` PR; with `volume > 0` emits a `volume` PR. `PRType` allows a third value (`"estimated_1rm"`) but the function never emits it — the gap is intentional, not a bug, and would need a history lookup to know if a new e1RM is actually a PR. PRs are persisted by the active-workout hook via the outbox; they survive offline finishes.
_Avoid_: achievement, milestone, best lift

**progress index**:
Strength progress expressed as a percentage of baseline: `(current e1RM / baseline e1RM) × 100`. Baseline is the best e1RM from the **first week that exercise appears** in history, not the app’s global first week. **100%** means “same as when you first logged this exercise.” Used on General progress, body-part charts, and per-exercise history views. See [docs/progress-charts.md](./docs/progress-charts.md).
_Avoid_: percent gain, strength score

**body part progress**:
Weekly and summary progress grouped by catalog `BodyPart` (`CHEST`, `BACK`, `SHOULDERS`, …). Category **current** and **change** are averages of constituent exercises; **change** uses relative percent `(last/first − 1) × 100`. Chart lines use carry-forward so an exercise’s last index counts in later weeks until updated. Component: `BodyPartProgressChart`.
_Avoid_: muscle group chart, body region stats

**chart period**:
Time window for progress charts: `1m` (30 days), `2m`, `3m`, `6m`, or `all`. Default `3m`. Defined in `lib/charts/periods.ts`; UI in `ChartPeriodSelector`.
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
