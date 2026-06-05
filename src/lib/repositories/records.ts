import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  Exercise,
  LoggedExercise,
  PersonalRecord,
  PersonalRecordEntity,
} from "@/lib/db/types";
import { bestWeight, volume } from "@/lib/training-metrics";
import { enqueueSync } from "@/lib/sync/queue";

export async function getPersonalRecords(): Promise<PersonalRecordEntity[]> {
  await ensureSeeded();
  return db.personalRecords.toArray();
}

export function createPRsFromWorkout(
  loggedExercises: LoggedExercise[],
  exerciseMap: Map<string, Exercise>,
  completedAt: string
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const now = Date.now();
  for (const ex of loggedExercises) {
    const exercise = exerciseMap.get(ex.exerciseId);
    if (!exercise) continue;
    const completed = ex.sets.filter((s) => s.completed);
    if (completed.length === 0) continue;
    const maxWeight = bestWeight(completed);
    const vol = volume(completed);
    if (maxWeight > 0) {
      records.push({
        id: `pr-${ex.id}-w-${now}`,
        exerciseId: ex.exerciseId,
        exerciseName: exercise.name,
        type: "weight",
        value: maxWeight,
        date: completedAt,
      });
    }
    if (vol > 0) {
      records.push({
        id: `pr-${ex.id}-v-${now}`,
        exerciseId: ex.exerciseId,
        exerciseName: exercise.name,
        type: "volume",
        value: vol,
        date: completedAt,
      });
    }
  }
  return records;
}

export async function createPersonalRecord(
  data: Omit<PersonalRecord, "id" | "revision" | "updatedAt">
): Promise<PersonalRecordEntity> {
  const now = new Date().toISOString();
  const entity: PersonalRecordEntity = {
    ...data,
    id: crypto.randomUUID(),
    revision: 1,
    updatedAt: now,
  };
  await db.personalRecords.put(entity);
  await enqueueSync({
    entityType: "personalRecord",
    entityId: entity.id,
    operation: "create",
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}
