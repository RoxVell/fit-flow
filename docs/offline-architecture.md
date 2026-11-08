# FitFlow offline-first architecture

The UI reads IndexedDB through Dexie live queries. Repository writes update local data
and enqueue changes together. Network access is optional; the service worker caches the
application and static exercise catalog, never user data or `/api/` responses.

```text
React → Dexie (source of truth) → syncQueue → /api/sync → Neon Postgres
```

Settings → "Offline mode" (`src/lib/hooks/use-offline-status.ts`) shows HTML and
RSC coverage for `APP_ROUTES`. "Ready" requires both for every app route; unrelated
or duplicate RSC entries do not count. Use it to debug devices without a web inspector.

`public/offline.html` reloads only after `GET /api/ping` returns 204
(`public/offline.js`). `navigator.onLine` can remain true without working internet;
reloading on that flag alone causes a loop. Verify this fallback against a stopped
server, since page-only network emulation may leave worker requests online.

## Local storage

The `fitflow_v2` database contains:

| Store | Purpose |
|---|---|
| `programs` | Programs, nested sessions and rest duration |
| `workoutLogs` | Completed workouts with nested exercises and sets |
| `bodyMeasurements` | Body metrics |
| `cardioSessions` | Cardio history |
| `workoutDrafts` | The current workout, key `active` |
| `exerciseReplacements` | Local replacement preferences |
| `syncQueue` | Pending changes and permanently rejected entries |
| `meta` | Sync status, key `app` |

Exercises come from `public/exercises/`; personal records are derived from workout
history. The old local `personalRecords` and `exercises` stores remain unused archives.
Dexie upgrades preserve user history and copy legacy exercise descriptions into referenced
records. The source catalog remains available even if a newer server record replaces an
embedded description; it is not used for rendering or sync. Seeding only populates an empty database.

Synced entities carry `revision`, `updatedAt`, and optional `deletedAt`. Database schema
versions are managed by Dexie. `meta.initialized` records whether a server sync completed;
`lastSyncAt` and the legacy `lastPullAt` are informational timestamps.

## Enabling sync

Development, production builds and local-only use do not require a database. The server
constructs its Neon client lazily, only when configured sync needs it.

For cross-device use, configure the server environment variable:

```dotenv
DATABASE_URL=postgresql://user:password@host/db
```

`GET /api/sync` returns `{ enabled: boolean }`. Sync is enabled whenever `DATABASE_URL`
is set, in both development and production. The endpoint has no authentication; all
clients using this server share one database. Without `DATABASE_URL`, the client checks
this configuration but sends no sync POSTs.

One `SyncProvider` runs the background process. `useSyncState` only subscribes to state;
adding a status display does not start another timer or network listener. Sync runs on
launch, reconnect, visible-tab focus and every 60 seconds while visible. If loading
the configuration fails, the timer retries it; only an explicit `enabled: false`
disables periodic attempts. There is no manual sync button. Settings shows the last
successful sync and any errors. Offline writes remain local until a later successful sync.

## Protocol and conflict resolution

`POST /api/sync` accepts:

```json
{
  "lastPullAt": null,
  "changes": [{
    "id": "queue-entry-id",
    "entityType": "workoutLog",
    "entityId": "workout-id",
    "operation": "update",
    "payload": {},
    "revision": 3
  }]
}
```

The payload must match its entity type; the example above omits the workout fields for
brevity. Allowed types are `program`, `workoutLog`, `bodyMeasurement`, `cardioSession`.
The API validates IDs, revisions, dates, numeric values and nested sessions/sets. Bodies
are limited to 10 MiB and 1,000 changes; the client drains the queue in batches of at most
100 changes per request. It stops on rejection, loss of connectivity or lack of progress
instead of immediately retrying a failed batch. Deletions need no payload.

The response contains `accepted`, `superseded`, `rejected`, `serverChanges` and
`serverTime`. Accepted and superseded changes leave the queue. Invalid changes have
`permanent: true` and become `failed` locally; a new edit replaces that failed entry.
Transient write failures remain pending. Legacy exercise/PR changes are acknowledged
as superseded so old queues cannot block current data.

Writes use a conditional SQL upsert: the incoming revision must be greater than the
stored revision. The comparison and write execute in one statement, so concurrent
requests cannot bypass the revision check. Equal revisions keep the server copy.
Deletions create tombstones even when an ID has not previously reached the server.
This is a revision policy, not wall-clock last-write-wins or automatic field merging.

Every response pulls **all four tables, including tombstones**. `lastPullAt` is accepted
for compatibility but does not filter records. A write concurrent with a pull therefore
arrives on that pull or the next one; it cannot be permanently skipped behind a timestamp
checkpoint. The tradeoff is response size proportional to personal history. For much
larger datasets a durable change feed would be a separate design, rather than restoring
the unsafe timestamp cutoff.

The client keeps newer local revisions, protects pending deletes, and skips identical
revision/timestamp pairs to avoid unnecessary live-query updates. Queue acknowledgments,
pulled data and metadata are applied in one IndexedDB transaction. PostgreSQL timestamps
are serialized as ISO strings so local sorting and date ranges remain consistent.

## PostgreSQL schema and upgrades

Runtime tables are `programs`, `workout_logs`, `body_measurements`, and `cardio_sessions`.
Programs and workouts store their nested structures as JSONB. Existing `exercises` and
`personal_records` tables are retained as archives; `archive-schema.ts` remains in the
Drizzle configuration so schema management does not propose dropping them.

New databases can use `npm run db:push` after configuring the environment. Existing
databases need the additive `drizzle/migrations/0002_program_rest_duration.sql` migration
before this version syncs; it adds the rest duration with a 90-second default. Review
schema operations before applying them. Application startup and builds never apply
migrations automatically.

Tests cover the request boundary, disabled/enabled modes, SQL revision guard,
serialization, delayed writes, tombstones and queue handling without a live database.
These checks do not replace integration verification against a configured PostgreSQL instance.
Production offline behavior is covered separately by the Playwright offline smoke test.
