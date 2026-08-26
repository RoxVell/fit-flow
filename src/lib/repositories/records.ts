import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  Exercise,
  LoggedExercise,
  PersonalRecord,
  PersonalRecordEntity,
  PRType,
  WorkoutLogEntity,
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
    if (!exercise || ex.excludeFromStats) continue;

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

export async function detectNewPRsFromWorkout(
  loggedExercises: LoggedExercise[],
  exerciseMap: Map<string, Exercise>,
  completedAt: string
): Promise<PersonalRecord[]> {
  const existingRecords = await getPersonalRecords();
  return createPRsFromWorkout(
    loggedExercises,
    exerciseMap,
    completedAt,
    existingRecords
  );
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

export async function deletePersonalRecord(id: string): Promise<void> {
  const existing = await db.personalRecords.get(id);
  if (!existing || existing.deletedAt) return;
  const now = new Date().toISOString();
  const revision = existing.revision + 1;
  await enqueueSync({
    entityType: "personalRecord",
    entityId: id,
    operation: "delete",
    revision,
  });
  await db.personalRecords.update(id, {
    deletedAt: now,
    revision,
    updatedAt: now,
  });
}

function legacyPRMatchesWorkout(
  record: PersonalRecordEntity,
  candidates: PersonalRecord[],
  completedAt: string
): boolean {
  if (record.workoutLogId) return false;
  if (record.date !== completedAt) return false;
  return candidates.some(
    (c) =>
      c.exerciseId === record.exerciseId &&
      c.type === record.type &&
      c.value === record.value
  );
}

export async function deletePersonalRecordsForWorkout(
  workoutLogId: string,
  log?: WorkoutLogEntity,
  exerciseMap?: Map<string, Exercise>
): Promise<void> {
  await ensureSeeded();
  const all = withoutDeleted(await db.personalRecords.toArray());
  const linked = all.filter((r) => r.workoutLogId === workoutLogId);

  let legacyMatches: PersonalRecordEntity[] = [];
  if (log && exerciseMap) {
    const completedAt = log.endedAt ?? log.startedAt;
    const candidates = createPRsFromWorkout(
      log.exercises,
      exerciseMap,
      completedAt,
      []
    );
    legacyMatches = all.filter((r) =>
      legacyPRMatchesWorkout(r, candidates, completedAt)
    );
  }

  const toDelete = new Map<string, PersonalRecordEntity>();
  for (const r of [...linked, ...legacyMatches]) {
    toDelete.set(r.id, r);
  }

  await Promise.all([...toDelete.keys()].map((id) => deletePersonalRecord(id)));
}

export async function reconcilePRsAfterWorkoutUpdate(
  log: WorkoutLogEntity,
  exerciseMap: Map<string, Exercise>
): Promise<PersonalRecord[]> {
  await deletePersonalRecordsForWorkout(log.id, log, exerciseMap);

  const completedAt = log.endedAt ?? log.startedAt;
  const newRecords = await detectNewPRsFromWorkout(
    log.exercises,
    exerciseMap,
    completedAt
  );

  for (const rec of newRecords) {
    const { id: _id, ...payload } = rec;
    await createPersonalRecord({ ...payload, workoutLogId: log.id });
  }

  return newRecords;
}
