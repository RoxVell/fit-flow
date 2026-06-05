import { db } from "@/lib/db/dexie";
import type {
  BodyMeasurementEntity,
  CardioSessionEntity,
  EntityType,
  ExerciseEntity,
  PersonalRecordEntity,
  ProgramEntity,
  WorkoutLogEntity,
} from "@/lib/db/types";
import type { ServerChange } from "./types";

type AnyEntity =
  | ExerciseEntity
  | ProgramEntity
  | WorkoutLogEntity
  | BodyMeasurementEntity
  | CardioSessionEntity
  | PersonalRecordEntity;

async function getLocalRevision(
  entityType: EntityType,
  entityId: string
): Promise<number | null> {
  switch (entityType) {
    case "exercise":
      return (await db.exercises.get(entityId))?.revision ?? null;
    case "program":
      return (await db.programs.get(entityId))?.revision ?? null;
    case "workoutLog":
      return (await db.workoutLogs.get(entityId))?.revision ?? null;
    case "bodyMeasurement":
      return (await db.bodyMeasurements.get(entityId))?.revision ?? null;
    case "cardioSession":
      return (await db.cardioSessions.get(entityId))?.revision ?? null;
    case "personalRecord":
      return (await db.personalRecords.get(entityId))?.revision ?? null;
    default:
      return null;
  }
}

async function applyEntity(entityType: EntityType, entity: AnyEntity): Promise<void> {
  if (entity.deletedAt) {
    switch (entityType) {
      case "exercise":
        await db.exercises.delete(entity.id);
        break;
      case "program":
        await db.programs.delete(entity.id);
        break;
      case "workoutLog":
        await db.workoutLogs.delete(entity.id);
        break;
      case "bodyMeasurement":
        await db.bodyMeasurements.delete(entity.id);
        break;
      case "cardioSession":
        await db.cardioSessions.delete(entity.id);
        break;
      case "personalRecord":
        await db.personalRecords.delete(entity.id);
        break;
    }
    return;
  }

  switch (entityType) {
    case "exercise":
      await db.exercises.put(entity as ExerciseEntity);
      break;
    case "program":
      await db.programs.put(entity as ProgramEntity);
      break;
    case "workoutLog":
      await db.workoutLogs.put(entity as WorkoutLogEntity);
      break;
    case "bodyMeasurement":
      await db.bodyMeasurements.put(entity as BodyMeasurementEntity);
      break;
    case "cardioSession":
      await db.cardioSessions.put(entity as CardioSessionEntity);
      break;
    case "personalRecord":
      await db.personalRecords.put(entity as PersonalRecordEntity);
      break;
  }
}

export async function applyServerChanges(changes: ServerChange[]): Promise<void> {
  for (const change of changes) {
    const entity = change.entity as AnyEntity & { id: string };
    if (!entity?.id) continue;

    const localRevision = await getLocalRevision(change.entityType, entity.id);
    if (localRevision !== null && localRevision > change.revision) {
      continue;
    }
    await applyEntity(change.entityType, entity);
  }
}
