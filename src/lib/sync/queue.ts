import { db } from "@/lib/db/dexie";
import type { EntityType, SyncQueueEntry } from "@/lib/db/types";
import type { SyncChange } from "./types";
import { generateId } from "@/lib/utils/id";

export async function enqueueSync(
  change: Omit<SyncChange, "id">
): Promise<void> {
  await db.transaction("rw", db.syncQueue, async () => {
    await db.syncQueue.where("entityId").equals(change.entityId)
      .filter((entry) => entry.entityType === change.entityType)
      .delete();
    await db.syncQueue.add({
      ...change,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: "pending",
    });
  });
}

export function getPending(limit = Infinity): Promise<SyncQueueEntry[]> {
  return db.syncQueue.orderBy("createdAt")
    .filter((entry) => entry.status === "pending")
    .limit(limit)
    .toArray();
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.syncQueue.bulkDelete(ids);
}

export async function markFailed(ids: string[]): Promise<void> {
  await db.syncQueue.where("id").anyOf(ids).modify({ status: "failed" });
}

export async function pendingCount(): Promise<number> {
  return db.syncQueue.where("status").equals("pending").count();
}

export async function hasPendingDelete(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  const count = await db.syncQueue
    .where("entityId")
    .equals(entityId)
    .filter(
      (e) =>
        e.entityType === entityType &&
        e.status === "pending" &&
        e.operation === "delete"
    )
    .count();
  return count > 0;
}
