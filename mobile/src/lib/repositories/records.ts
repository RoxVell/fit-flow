import { TABLES, getDb } from "@/lib/db/database";
import type { LoggedExercise, PersonalRecord, PersonalRecordEntity, PRType, WorkoutLogEntity } from "@/lib/db/types";
import { persistSoftDelete, persistWithSync } from "@/lib/repositories/entity-crud";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";
import { generateId } from "@/lib/utils/id";

type Row = { data: string };

function parse(rows: Row[]): PersonalRecordEntity[] {
  return rows.map((r) => JSON.parse(r.data) as PersonalRecordEntity);
}

function put(entity: PersonalRecordEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.personalRecords} (id, exercise_id, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.exerciseId,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

export function listPersonalRecords(): PersonalRecordEntity[] {
  return parse(
    getDb().getAllSync<Row>(`SELECT data FROM ${TABLES.personalRecords} WHERE deleted_at IS NULL`),
  );
}

export function getPersonalRecord(id: string): PersonalRecordEntity | undefined {
  const row = getDb().getFirstSync<Row>(
    `SELECT data FROM ${TABLES.personalRecords} WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
  return row ? (JSON.parse(row.data) as PersonalRecordEntity) : undefined;
}

export function createPersonalRecord(data: Omit<PersonalRecord, "id">): PersonalRecordEntity {
  const entity: PersonalRecordEntity = {
    ...data,
    id: generateId(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
  persistWithSync(put, "personalRecord", entity, "create");
  return entity;
}

// Tombstone, like the web app (softDeleteEntity).
export function deletePersonalRecord(id: string) {
  persistSoftDelete("personalRecord", id, getPersonalRecord, put);
}

function legacyPRMatchesWorkout(
  record: PersonalRecordEntity,
  candidates: Omit<PersonalRecord, "id">[],
  completedAt: string,
): boolean {
  if (record.workoutLogId) return false;
  if (record.date !== completedAt) return false;
  return candidates.some(
    (candidate) =>
      candidate.exerciseId === record.exerciseId &&
      candidate.type === record.type &&
      candidate.value === record.value,
  );
}

/** Drop PRs linked to this log, plus unlinked legacy PRs that match the same workout. */
export function deletePersonalRecordsForWorkout(
  workoutLogId: string,
  log?: WorkoutLogEntity,
  getExerciseName?: (exerciseId: string) => string | undefined,
) {
  const all = listPersonalRecords();
  const toDelete = new Set<string>();
  for (const record of all) {
    if (record.workoutLogId === workoutLogId) toDelete.add(record.id);
  }
  if (log && getExerciseName) {
    const completedAt = log.endedAt ?? log.startedAt;
    const candidates = createPRsFromWorkout(log.exercises, getExerciseName, completedAt, []);
    for (const record of all) {
      if (legacyPRMatchesWorkout(record, candidates, completedAt)) toDelete.add(record.id);
    }
  }
  for (const id of toDelete) deletePersonalRecord(id);
}

function bestPreviousValue(existing: PersonalRecord[], exerciseId: string, type: PRType): number {
  return existing
    .filter((r) => r.exerciseId === exerciseId && r.type === type)
    .reduce((max, r) => Math.max(max, r.value), 0);
}

/**
 * PRs a finished workout would produce against `existing` records
 * (see CONTEXT.md, "personal record"). Pure; nothing is persisted.
 */
export function createPRsFromWorkout(
  loggedExercises: LoggedExercise[],
  getExerciseName: (exerciseId: string) => string | undefined,
  completedAt: string,
  existing: PersonalRecord[] = [],
): Omit<PersonalRecord, "id">[] {
  const records: Omit<PersonalRecord, "id">[] = [];

  for (const ex of loggedExercises) {
    const exerciseName = getExerciseName(ex.exerciseId);
    if (!exerciseName || ex.excludeFromStats) continue;

    const completed = ex.sets.filter((s) => s.completed);
    if (completed.length === 0) continue;

    const candidates: [PRType, number][] = [
      ["weight", bestWeight(completed)],
      ["volume", volume(completed)],
      ["estimated_1rm", Math.round(bestE1RM(completed) * 10) / 10],
    ];
    for (const [type, value] of candidates) {
      if (value <= 0 || value <= bestPreviousValue(existing, ex.exerciseId, type)) continue;
      records.push({ exerciseId: ex.exerciseId, exerciseName, type, value, date: completedAt });
    }
  }

  return records;
}
