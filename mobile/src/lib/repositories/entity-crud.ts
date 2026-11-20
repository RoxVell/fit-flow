import type { SyncableEntity } from "@/lib/db/types";
import type { EntityType } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";

type Entity = SyncableEntity & { id: string };

/** Persist locally and enqueue the change for server sync. */
export function persistWithSync<T extends Entity>(
  put: (entity: T) => void,
  entityType: EntityType,
  entity: T,
  operation: "create" | "update",
): T {
  put(entity);
  enqueueSync({
    entityType,
    entityId: entity.id,
    operation,
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export function persistHardDelete(
  entityType: EntityType,
  id: string,
  get: (id: string) => Entity | undefined,
  remove: (id: string) => void,
): void {
  const existing = get(id);
  if (!existing || existing.deletedAt) return;
  enqueueSync({
    entityType,
    entityId: id,
    operation: "delete",
    revision: existing.revision + 1,
  });
  remove(id);
}

export function persistSoftDelete<T extends Entity>(
  entityType: EntityType,
  id: string,
  get: (id: string) => T | undefined,
  put: (entity: T) => void,
  extra?: Partial<T>,
): void {
  const existing = get(id);
  if (!existing || existing.deletedAt) return;
  const now = new Date().toISOString();
  const revision = existing.revision + 1;
  enqueueSync({ entityType, entityId: id, operation: "delete", revision });
  put({ ...existing, ...extra, deletedAt: now, revision, updatedAt: now });
}
