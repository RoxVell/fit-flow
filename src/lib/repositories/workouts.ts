import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  Exercise,
  LoggedExercise,
  WorkoutLog,
  WorkoutLogEntity,
} from "@/lib/db/types";
import { compareByDate } from "@/lib/utils/date";
import { createEntity, hardDeleteEntity, updateEntity } from "./entity-crud";
import { attachExercises, getExerciseMap } from "./exercises";
import {
  deletePersonalRecordsForWorkout,
  reconcilePRsAfterWorkoutUpdate,
} from "./records";

export async function getCompletedWorkoutLogsInRange(
  from: Date,
  to: Date
): Promise<WorkoutLogEntity[]> {
  await ensureSeeded();
  const [all, exerciseMap] = await Promise.all([
    db.workoutLogs
      .where("startedAt")
      .between(from.toISOString(), to.toISOString(), true, true)
      .filter((l) => !l.deletedAt && !!l.endedAt)
      .toArray(),
    getExerciseMap(),
  ]);
  const sorted = all.sort((a, b) => compareByDate(a.startedAt, b.startedAt));
  return attachExercises(sorted, exerciseMap);
}

export async function createWorkoutLog(
  data: Omit<WorkoutLog, "id" | "revision" | "updatedAt">
): Promise<WorkoutLogEntity> {
  return createEntity(db.workoutLogs, "workoutLog", data);
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>
): Promise<WorkoutLogEntity | undefined> {
  return updateEntity(db.workoutLogs, "workoutLog", id, data);
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  await hardDeleteEntity(db.workoutLogs, "workoutLog", id);
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
