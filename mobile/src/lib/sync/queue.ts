import { TABLES, getDb } from "@/lib/db/database";
import type { EntityType, SyncQueueEntry } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";

const listeners = new Set<() => void>();

export function subscribeSyncQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((cb) => cb());
}

type Row = { data: string };

function parse(rows: Row[]): SyncQueueEntry[] {
  return rows.map((r) => JSON.parse(r.data) as SyncQueueEntry);
}

export function enqueueSync(input: {
  entityType: EntityType;
  entityId: string;
  operation: SyncQueueEntry["operation"];
  payload?: unknown;
  revision: number;
}): void {
  coalescePending(input.entityType, input.entityId);

  const entry: SyncQueueEntry = {
    id: generateId(),
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payload: input.payload,
    revision: input.revision,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  getDb().runSync(
    `INSERT INTO ${TABLES.syncQueue} (id, entity_id, status, created_at, data) VALUES (?, ?, ?, ?, ?)`,
    entry.id,
    entry.entityId,
    entry.status,
    entry.createdAt,
    JSON.stringify(entry),
  );
  notify();
}

function coalescePending(entityType: EntityType, entityId: string): void {
  const pending = getPending().filter((e) => e.entityType === entityType && e.entityId === entityId);
  if (pending.length === 0) return;
  const ids = pending.map((e) => e.id);
  getDb().runSync(
    `DELETE FROM ${TABLES.syncQueue} WHERE id IN (${ids.map(() => "?").join(",")})`,
    ...ids,
  );
}

export function getPending(): SyncQueueEntry[] {
  return parse(
    getDb().getAllSync<Row>(
      `SELECT data FROM ${TABLES.syncQueue} WHERE status = 'pending' ORDER BY created_at ASC`,
    ),
  );
}

export function markSynced(ids: string[]): void {
  if (ids.length === 0) return;
  getDb().runSync(
    `DELETE FROM ${TABLES.syncQueue} WHERE id IN (${ids.map(() => "?").join(",")})`,
    ...ids,
  );
  notify();
}

export function pendingCount(): number {
  const row = getDb().getFirstSync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${TABLES.syncQueue} WHERE status = 'pending'`,
  );
  return row?.n ?? 0;
}

export function hasPendingDelete(entityType: EntityType, entityId: string): boolean {
  return getPending().some(
    (e) => e.entityType === entityType && e.entityId === entityId && e.operation === "delete",
  );
}
