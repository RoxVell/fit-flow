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

**active workout**:
The in-progress workout session held in the Zustand `workout-store`. Distinct from a `WorkoutLog` (which is the persisted record of a completed workout). The active workout can be edited freely; the log is created on finish and is immutable thereafter.
_Avoid_: current session, live workout, draft workout

**training metric**:
A named derivation of one or more sets: `e1RM(weight, reps)`, `volume(sets)`, `bestWeight(sets)`, `bestE1RM(sets)`. Lives in `lib/training-metrics.ts`; all four formulas are colocated there and never inlined. Callers pass a structural `{ weight, reps }` shape (e.g. a filtered `LoggedSet[]`), never the full `LoggedSet` record.
_Avoid_: stat, measurement, number

**e1RM**:
Epley-estimated one-rep max. `e1RM(weight, reps)` returns `weight` for a single rep, else `weight * (1 + reps / 30)`. The canonical strength projection of a working set; surfaced in the dashboard, exercise history, and the per-exercise progress chart. Computed only on `completed` sets.
_Avoid_: estimated 1RM, projected max, one-rep max

**personal record (PR)**:
A `PersonalRecord` entry the system emits on workout finish for each completed exercise. Built by `createPRsFromWorkout(loggedExercises, exerciseMap, completedAt)` in `db/queries.ts`: for each completed exercise with `bestWeight > 0` emits a `weight` PR; with `volume > 0` emits a `volume` PR. `PRType` allows a third value (`"estimated_1rm"`) but the function never emits it — the gap is intentional, not a bug, and would need a history lookup to know if a new e1RM is actually a PR. PRs are persisted by the active-workout hook via the outbox; they survive offline finishes.
_Avoid_: achievement, milestone, best lift
