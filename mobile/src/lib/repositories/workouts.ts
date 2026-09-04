import { TABLES, getDb } from "@/lib/db/database";
import type { WorkoutLog, WorkoutLogEntity } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";

import { deletePersonalRecordsForWorkout } from "./records";

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
  put(entity);
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
  put(entity);
  return entity;
}

// The web app hard-deletes workout logs (the server still gets the delete via sync).
export function deleteWorkoutLog(id: string) {
  getDb().runSync(`DELETE FROM ${TABLES.workoutLogs} WHERE id = ?`, id);
}

/** Delete a log together with the PRs it produced. */
export function removeWorkoutLog(id: string) {
  if (!getWorkoutLog(id)) return;
  getDb().withTransactionSync(() => {
    deletePersonalRecordsForWorkout(id);
    deleteWorkoutLog(id);
  });
}
