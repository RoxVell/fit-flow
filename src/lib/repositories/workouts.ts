import { withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  Exercise,
  LoggedExercise,
  WorkoutLog,
  WorkoutLogEntity,
} from "@/lib/db/types";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";
import { enqueueSync } from "@/lib/sync/queue";
import { getExerciseMap } from "./exercises";
import {
  deletePersonalRecordsForWorkout,
  reconcilePRsAfterWorkoutUpdate,
} from "./records";

function attachExercisesToLogs(
  logs: WorkoutLogEntity[],
  exerciseMap: Map<string, Exercise>
): WorkoutLogEntity[] {
  return logs.map((log) => ({
    ...log,
    exercises: log.exercises.map((e) => ({
      ...e,
      exercise: exerciseMap.get(e.exerciseId),
    })),
  }));
}

export async function getWorkoutLogs(limit = 20): Promise<WorkoutLogEntity[]> {
  await ensureSeeded();
  const [all, exerciseMap] = await Promise.all([
    db.workoutLogs
      .orderBy("startedAt")
      .reverse()
      .filter((l) => !l.deletedAt)
      .limit(limit)
      .toArray(),
    getExerciseMap(),
  ]);
  return attachExercisesToLogs(all, exerciseMap);
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLogEntity | undefined> {
  await ensureSeeded();
  const [log, exerciseMap] = await Promise.all([db.workoutLogs.get(id), getExerciseMap()]);
  if (!log || log.deletedAt) return undefined;
  return attachExercisesToLogs([log], exerciseMap)[0];
}

export async function getExerciseHistory(exerciseId: string) {
  await ensureSeeded();
  const logs = withoutDeleted(await db.workoutLogs.toArray())
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    return {
      date: l.startedAt,
      volume: volume(completed),
      maxWeight: bestWeight(completed),
      estimated1RM: bestE1RM(completed),
    };
  });
}

export async function getExerciseDetailedHistory(exerciseId: string) {
  await ensureSeeded();
  const logs = withoutDeleted(await db.workoutLogs.toArray())
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    return {
      date: l.startedAt,
      bestE1RM: bestE1RM(completed),
      sets: completed.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        type: s.type,
        setOrder: s.setOrder,
      })),
    };
  });
}

export async function createWorkoutLog(
  data: Omit<WorkoutLog, "id" | "revision" | "updatedAt">
): Promise<WorkoutLogEntity> {
  const now = new Date().toISOString();
  const entity: WorkoutLogEntity = {
    ...data,
    id: crypto.randomUUID(),
    revision: 1,
    updatedAt: now,
  };
  await db.workoutLogs.put(entity);
  await enqueueSync({
    entityType: "workoutLog",
    entityId: entity.id,
    operation: "create",
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>
): Promise<WorkoutLogEntity | undefined> {
  const existing = await db.workoutLogs.get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const entity: WorkoutLogEntity = {
    ...existing,
    ...data,
    id,
    revision: existing.revision + 1,
    updatedAt: now,
  };
  await db.workoutLogs.put(entity);
  await enqueueSync({
    entityType: "workoutLog",
    entityId: entity.id,
    operation: "update",
    payload: entity,
    revision: entity.revision,
  });
  return entity;
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  const existing = await db.workoutLogs.get(id);
  if (!existing || existing.deletedAt) return;
  const revision = existing.revision + 1;
  await enqueueSync({
    entityType: "workoutLog",
    entityId: id,
    operation: "delete",
    revision,
  });
  await db.workoutLogs.delete(id);
}

export async function saveWorkoutEdits(
  id: string,
  exercises: LoggedExercise[],
  exerciseMap: Map<string, Exercise>
): Promise<WorkoutLogEntity | undefined> {
  const updated = await updateWorkoutLog(id, { exercises });
  if (!updated) return undefined;
  await reconcilePRsAfterWorkoutUpdate(updated, exerciseMap);
  return updated;
}

export async function removeWorkoutLog(id: string): Promise<void> {
  const [existing, exerciseMap] = await Promise.all([
    db.workoutLogs.get(id),
    getExerciseMap(),
  ]);
  if (!existing || existing.deletedAt) return;
  await deletePersonalRecordsForWorkout(id, existing, exerciseMap);
  await deleteWorkoutLog(id);
}
