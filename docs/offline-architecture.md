# FitFlow Offline-First Architecture

## Overview

```
React Components
    ↓ useLiveQuery (dexie-react-hooks)
Dexie (IndexedDB) — single source of truth for UI
    ↓ repositories (write + enqueue)
syncQueue
    ↓ SyncService
POST /api/sync
    ↓ Drizzle ORM
Neon PostgreSQL
```

User data is **never** stored in Service Worker caches. SW caches static assets (JS, CSS, images, pages) and the **exercise catalog** (`/exercises/*.json`). See [exercise-library-and-i18n.md](./exercise-library-and-i18n.md).

## Dexie Schema (`fitflow_v2`)

| Store | Purpose |
|-------|---------|
| `exercises` | Legacy exercise store (catalog is now static JSON; see [exercise-library-and-i18n.md](./exercise-library-and-i18n.md)) |
| `programs` | Programs with nested `sessions` |
| `workoutLogs` | Logs with nested `exercises` / `sets` |
| `bodyMeasurements` | Body metrics |
| `cardioSessions` | Cardio history |
| `personalRecords` | PRs |
| `syncQueue` | Pending server sync operations |
| `workoutDrafts` | In-progress workout (singleton `active`) |
| `meta` | Sync state singleton (`key: app`) |

### Syncable entity fields

- `revision` — incremented on each write
- `updatedAt` — ISO timestamp
- `deletedAt` — soft delete marker

### Meta singleton

```ts
{
  key: 'app',
  initialized: boolean,
  lastPullAt: string | null,
  lastSyncAt: string | null,
  schemaVersion: number,
}
```

## Sync Protocol

Single endpoint: `POST /api/sync`

### Request

```json
{
  "lastPullAt": null,
  "changes": []
}
```

- `lastPullAt: null` — first sync / full pull (server returns all records)
- `lastPullAt: "<ISO>"` — incremental pull (records with `updated_at > lastPullAt`)

Each change in `changes`:

```json
{
  "id": "queue-entry-uuid",
  "entityType": "workoutLog",
  "entityId": "entity-uuid",
  "operation": "create|update|delete",
  "payload": {},
  "revision": 3
}
```

### Response

```json
{
  "accepted": ["queue-entry-uuid"],
  "rejected": [],
  "serverChanges": [{ "entityType": "...", "entity": {}, "revision": 1 }],
  "serverTime": "2026-06-05T20:00:00.000Z"
}
```

## Conflict Resolution

Last Write Wins by `revision`:

- Server applies client change if `client.revision > server.revision`
- Client applies server change if `server.revision >= local.revision`
- Tie → server wins (equal revision: server keeps its copy; client accepts server on pull)

Single user, single device — no CRDT/OT.

## Sync Triggers

1. App start (`SyncProvider`)
2. `window.online`
3. `document.visibilitychange` (visible + online)
4. 60s interval when `syncQueue` has pending items

## Offline Behavior

1. **First launch offline**: exercise catalog from SW cache (`/exercises/`); programs seeded locally; `meta.initialized = false`
2. **Reads**: always from Dexie via `useLiveQuery`
3. **Writes**: Dexie first → `syncQueue` → background sync when online
4. **First launch online**: `POST /api/sync` with `lastPullAt: null` loads server data

## PostgreSQL (Neon)

Tables: `exercises`, `programs` (sessions JSONB), `workout_logs` (exercises JSONB), `body_measurements`, `cardio_sessions`, `personal_records`.

Migrations applied via Neon MCP (`prepare_database_migration` / `complete_database_migration`).

## Development

```bash
# .env.local
DATABASE_URL=postgresql://...

npm run dev
npm run db:push      # optional schema push
```

Test offline: DevTools → Network → Offline, or disable network on device after first sync.

## Key Files

| Path | Role |
|------|------|
| `src/lib/db/dexie.ts` | Dexie database |
| `src/lib/repositories/*.ts` | Data access + enqueue |
| `src/lib/sync/sync-service.ts` | Sync engine |
| `src/lib/hooks/use-data.ts` | `useLiveQuery` hooks |
| `src/app/api/sync/route.ts` | Sync API |
| `src/server/sync.ts` | Server sync logic |
| `src/server/db/schema.ts` | Drizzle schema |
