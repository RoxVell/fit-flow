import type { Table, UpdateSpec } from "dexie";
import type { EntityType, SyncableEntity } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";
import { generateId } from "@/lib/utils/id";

type Entity = SyncableEntity & { id: string };

/** Put the entity locally and enqueue the change for server sync. */
export async function putEntityWithSync<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  entity: T,
  operation: "create" | "update"
): Promise<T> {
  await table.put(entity);
  await enqueueSync({
    entityType,
    entityId: entity.id,
    operation,
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export async function createEntity<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  data: Omit<NoInfer<T>, "id" | "revision" | "updatedAt">
): Promise<T> {
  const entity = {
    ...data,
    id: generateId(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  } as T;
  return putEntityWithSync(table, entityType, entity, "create");
}

export async function updateEntity<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  id: string,
  data: Partial<NoInfer<T>>
): Promise<T | undefined> {
  const existing = await table.get(id);
  if (!existing || existing.deletedAt) return undefined;
  const entity: T = {
    ...existing,
    ...data,
    id,
    revision: existing.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  return putEntityWithSync(table, entityType, entity, "update");
}

/** Returns the next revision after enqueueing, or null when there is nothing to delete. */
async function enqueueDelete<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  id: string
): Promise<number | null> {
  const existing = await table.get(id);
  if (!existing || existing.deletedAt) return null;
  const revision = existing.revision + 1;
  await enqueueSync({ entityType, entityId: id, operation: "delete", revision });
  return revision;
}

/** Remove the row from IndexedDB entirely; the server still receives the delete. */
export async function hardDeleteEntity<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  id: string
): Promise<void> {
  if ((await enqueueDelete(table, entityType, id)) === null) return;
  await table.delete(id);
}

/** Tombstone the row locally so later conflict resolution can see the delete. */
export async function softDeleteEntity<T extends Entity>(
  table: Table<T, string>,
  entityType: EntityType,
  id: string,
  extraPatch?: UpdateSpec<T>
): Promise<void> {
  const revision = await enqueueDelete(table, entityType, id);
  if (revision === null) return;
  const now = new Date().toISOString();
  await table.update(id, {
    deletedAt: now,
    revision,
    updatedAt: now,
    ...extraPatch,
  } as unknown as UpdateSpec<T>);
}
