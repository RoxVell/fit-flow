import { TABLES, getDb } from "@/lib/db/database";
import type { LoggedExercise, WorkoutLog, WorkoutLogEntity } from "@/lib/db/types";
import { getExercise } from "@/lib/exercises/catalog";
import { persistHardDelete, persistWithSync } from "@/lib/repositories/entity-crud";
import { generateId } from "@/lib/utils/id";

import { deletePersonalRecordsForWorkout, createPRsFromWorkout, createPersonalRecord, listPersonalRecords } from "./records";

type Row = { data: string };

function parse(rows: Row[]): WorkoutLogEntity[] {
  return rows.map((r) => JSON.parse(r.data) as WorkoutLogEntity);
}

function put(entity: WorkoutLogEntity) {
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.workoutLogs} (id, started_at, updated_at, deleted_at, data) VALUES (?, ?, ?, ?, ?)`,
    entity.id,
    entity.startedAt,
    entity.updatedAt,
    entity.deletedAt ?? null,
    JSON.stringify(entity),
  );
}

/** Newest first, including in-progress logs (no endedAt). */
export function listWorkoutLogs(limit = 20): WorkoutLogEntity[] {
  return parse(
    getDb().getAllSync<Row>(
      `SELECT data FROM ${TABLES.workoutLogs} WHERE deleted_at IS NULL ORDER BY started_at DESC LIMIT ?`,
      limit,
    ),
  );
}

/** Newest first, only finished workouts. */
export function listCompletedWorkoutLogs(limit = 20): WorkoutLogEntity[] {
  return parse(
    getDb().getAllSync<Row>(
      `SELECT data FROM ${TABLES.workoutLogs}
       WHERE deleted_at IS NULL AND json_extract(data, '$.endedAt') IS NOT NULL
       ORDER BY started_at DESC LIMIT ?`,
      limit,
    ),
  );
}

export function countCompletedWorkoutLogs(): number {
  const row = getDb().getFirstSync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${TABLES.workoutLogs}
     WHERE deleted_at IS NULL AND json_extract(data, '$.endedAt') IS NOT NULL`,
  );
  return row?.n ?? 0;
}

/** Oldest first, matching the web CSV export order. */
export function getCompletedWorkoutLogsInRange(from: Date, to: Date): WorkoutLogEntity[] {
  return parse(
    getDb().getAllSync<Row>(
      `SELECT data FROM ${TABLES.workoutLogs}
       WHERE deleted_at IS NULL
         AND json_extract(data, '$.endedAt') IS NOT NULL
         AND started_at >= ? AND started_at <= ?
       ORDER BY started_at ASC`,
      from.toISOString(),
      to.toISOString(),
    ),
  );
}

export function getWorkoutLog(id: string): WorkoutLogEntity | undefined {
  const row = getDb().getFirstSync<Row>(
    `SELECT data FROM ${TABLES.workoutLogs} WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
  return row ? (JSON.parse(row.data) as WorkoutLogEntity) : undefined;
}

export function createWorkoutLog(data: Omit<WorkoutLog, "id">): WorkoutLogEntity {
  const entity: WorkoutLogEntity = {
    ...data,
    id: generateId(),
    revision: 1,
    updatedAt: new Date().toISOString(),
  };
  persistWithSync(put, "workoutLog", entity, "create");
  return entity;
}

export function updateWorkoutLog(id: string, patch: Partial<WorkoutLog>): WorkoutLogEntity | undefined {
  const existing = getWorkoutLog(id);
  if (!existing) return undefined;
  const entity: WorkoutLogEntity = {
    ...existing,
    ...patch,
    id,
    revision: existing.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  persistWithSync(put, "workoutLog", entity, "update");
  return entity;
}

// The web app hard-deletes workout logs (the server still gets the delete via sync).
export function deleteWorkoutLog(id: string) {
  persistHardDelete("workoutLog", id, getWorkoutLog, (logId) => {
    getDb().runSync(`DELETE FROM ${TABLES.workoutLogs} WHERE id = ?`, logId);
  });
}

function exerciseName(exerciseId: string): string | undefined {
  return getExercise(exerciseId)?.name.en ?? exerciseId;
}

/** Delete a log together with the PRs it produced. */
export function removeWorkoutLog(id: string) {
  const existing = getWorkoutLog(id);
  if (!existing) return;
  getDb().withTransactionSync(() => {
    deletePersonalRecordsForWorkout(id, existing, exerciseName);
    deleteWorkoutLog(id);
  });
}

/** Persist edited sets/notes and rebuild PRs for this log against remaining records. */
export function saveWorkoutEdits(
  id: string,
  exercises: LoggedExercise[],
  getExerciseName: (exerciseId: string) => string | undefined,
): WorkoutLogEntity | undefined {
  const existing = getWorkoutLog(id);
  if (!existing) return undefined;

  let updated: WorkoutLogEntity | undefined;
  getDb().withTransactionSync(() => {
    deletePersonalRecordsForWorkout(id, existing, getExerciseName);
    updated = updateWorkoutLog(id, { exercises });
    if (!updated) return;
    const completedAt = updated.endedAt ?? updated.startedAt;
    const records = createPRsFromWorkout(exercises, getExerciseName, completedAt, listPersonalRecords());
    for (const record of records) {
      createPersonalRecord({ ...record, workoutLogId: id });
    }
  });
  return updated;
}
