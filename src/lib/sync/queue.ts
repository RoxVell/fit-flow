import { db } from "@/lib/db/dexie";
import type { EntityType, SyncQueueEntry } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";

export async function enqueueSync(input: {
  entityType: EntityType;
  entityId: string;
  operation: SyncQueueEntry["operation"];
  payload?: unknown;
  revision: number;
}): Promise<void> {
  await coalescePending(input.entityType, input.entityId);

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
  await db.syncQueue.put(entry);
}

async function coalescePending(entityType: EntityType, entityId: string): Promise<void> {
  const pending = await db.syncQueue
    .where("status")
    .equals("pending")
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .toArray();
  if (pending.length > 0) {
    await db.syncQueue.bulkDelete(pending.map((e) => e.id));
  }
}

export async function getPending(): Promise<SyncQueueEntry[]> {
  return db.syncQueue
    .where("status")
    .equals("pending")
    .sortBy("createdAt");
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.syncQueue.bulkDelete(ids);
}

export async function pendingCount(): Promise<number> {
  return db.syncQueue.where("status").equals("pending").count();
}

export async function hasPendingDelete(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  const count = await db.syncQueue
    .where("status")
    .equals("pending")
    .filter(
      (e) =>
        e.entityType === entityType &&
        e.entityId === entityId &&
        e.operation === "delete"
    )
    .count();
  return count > 0;
}
