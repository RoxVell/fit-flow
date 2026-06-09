import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  Exercise,
  LoggedExercise,
  PersonalRecord,
  PersonalRecordEntity,
  PRType,
} from "@/lib/db/types";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";
import { enqueueSync } from "@/lib/sync/queue";

export async function getPersonalRecords(): Promise<PersonalRecordEntity[]> {
  await ensureSeeded();
  return withoutDeleted(await db.personalRecords.toArray());
}

function bestPreviousValue(
  existing: PersonalRecord[],
  exerciseId: string,
  type: PRType
): number {
  return existing
    .filter((r) => r.exerciseId === exerciseId && r.type === type)
    .reduce((max, r) => Math.max(max, r.value), 0);
}

function maybeRecord(
  records: PersonalRecord[],
  existing: PersonalRecord[],
  params: {
    loggedExerciseId: string;
    exerciseId: string;
    exerciseName: string;
    type: PRType;
    value: number;
    completedAt: string;
    suffix: string;
    now: number;
  }
) {
  const { value } = params;
  if (value <= 0) return;

  const previous = bestPreviousValue(existing, params.exerciseId, params.type);
  if (value <= previous) return;

  records.push({
    id: `pr-${params.loggedExerciseId}-${params.suffix}-${params.now}`,
    exerciseId: params.exerciseId,
    exerciseName: params.exerciseName,
    type: params.type,
    value,
    date: params.completedAt,
  });
}

export function createPRsFromWorkout(
  loggedExercises: LoggedExercise[],
  exerciseMap: Map<string, Exercise>,
  completedAt: string,
  existingRecords: PersonalRecord[] = []
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const now = Date.now();

  for (const ex of loggedExercises) {
    const exercise = exerciseMap.get(ex.exerciseId);
    if (!exercise) continue;

    const completed = ex.sets.filter((s) => s.completed);
    if (completed.length === 0) continue;

    const base = {
      loggedExerciseId: ex.id,
      exerciseId: ex.exerciseId,
      exerciseName: exercise.name,
      completedAt,
      now,
    };

    maybeRecord(records, existingRecords, {
      ...base,
      type: "weight",
      value: bestWeight(completed),
      suffix: "w",
    });

    maybeRecord(records, existingRecords, {
      ...base,
      type: "volume",
      value: volume(completed),
      suffix: "v",
    });

    const e1rm = Math.round(bestE1RM(completed) * 10) / 10;
    maybeRecord(records, existingRecords, {
      ...base,
      type: "estimated_1rm",
      value: e1rm,
      suffix: "e",
    });
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
