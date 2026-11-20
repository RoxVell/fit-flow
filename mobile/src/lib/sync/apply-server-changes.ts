import { TABLES, getDb } from "@/lib/db/database";
import type {
  BodyMeasurementEntity,
  CardioSessionEntity,
  EntityType,
  PersonalRecordEntity,
  ProgramEntity,
  SyncableEntity,
  WorkoutLogEntity,
} from "@/lib/db/types";
import { hasPendingDelete } from "./queue";
import type { ServerChange } from "./types";

type SyncedEntity = SyncableEntity & { id: string };

function getAny(table: string, id: string): SyncedEntity | undefined {
  const row = getDb().getFirstSync<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?`, id);
  return row ? (JSON.parse(row.data) as SyncedEntity) : undefined;
}

function putProgram(entity: ProgramEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.programs} (id, is_active, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.isActive ? 1 : 0,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

function putWorkoutLog(entity: WorkoutLogEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.workoutLogs} (id, started_at, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.startedAt,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

function putMeasurement(entity: BodyMeasurementEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.bodyMeasurements} (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.date,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

function putCardio(entity: CardioSessionEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.cardioSessions} (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.date,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

function putRecord(entity: PersonalRecordEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.personalRecords} (id, exercise_id, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.exerciseId,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

const TABLE_BY_TYPE: Partial<Record<EntityType, string>> = {
  program: TABLES.programs,
  workoutLog: TABLES.workoutLogs,
  bodyMeasurement: TABLES.bodyMeasurements,
  cardioSession: TABLES.cardioSessions,
  personalRecord: TABLES.personalRecords,
};

function putEntity(entityType: EntityType, entity: SyncedEntity) {
  switch (entityType) {
    case "program":
      putProgram(entity as ProgramEntity);
      return;
    case "workoutLog":
      putWorkoutLog(entity as WorkoutLogEntity);
      return;
    case "bodyMeasurement":
      putMeasurement(entity as BodyMeasurementEntity);
      return;
    case "cardioSession":
      putCardio(entity as CardioSessionEntity);
      return;
    case "personalRecord":
      putRecord(entity as PersonalRecordEntity);
      return;
    default:
      return;
  }
}

export function applyServerChanges(changes: ServerChange[]): void {
  for (const change of changes) {
    const table = TABLE_BY_TYPE[change.entityType];
    const entity = change.entity as SyncedEntity;
    if (!table || !entity?.id) continue;

    const localRevision = getAny(table, entity.id)?.revision ?? null;

    if (entity.deletedAt) {
      if (localRevision !== null && change.revision < localRevision) continue;
      getDb().runSync(`DELETE FROM ${table} WHERE id = ?`, entity.id);
      continue;
    }

    if (localRevision !== null && localRevision > change.revision) continue;
    if (localRevision === null && hasPendingDelete(change.entityType, entity.id)) continue;
    putEntity(change.entityType, entity);
  }
}
