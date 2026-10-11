import type { Table } from "dexie";
import { db } from "@/lib/db/dexie";
import type { EntityType, SyncableEntity } from "@/lib/db/types";
import { hasPendingDelete } from "./queue";
import type { ServerChange } from "./types";

type SyncedEntity = SyncableEntity & { id: string };

const syncedTables: Record<EntityType, Table<SyncedEntity, string>> = {
  exercise: db.exercises,
  program: db.programs,
  workoutLog: db.workoutLogs,
  bodyMeasurement: db.bodyMeasurements,
  cardioSession: db.cardioSessions,
  personalRecord: db.personalRecords,
};

export async function applyServerChanges(changes: ServerChange[]): Promise<void> {
  for (const change of changes) {
    const table = syncedTables[change.entityType];
    const entity = change.entity as SyncedEntity;
    if (!table || !entity?.id) continue;

    const localRevision = (await table.get(entity.id))?.revision ?? null;

    if (entity.deletedAt) {
      if (localRevision !== null && change.revision < localRevision) {
        continue;
      }
      await table.delete(entity.id);
      continue;
    }

    if (localRevision !== null && localRevision > change.revision) {
      continue;
    }
    if (localRevision === null && (await hasPendingDelete(change.entityType, entity.id))) {
      continue;
    }
    await table.put(entity);
  }
}
