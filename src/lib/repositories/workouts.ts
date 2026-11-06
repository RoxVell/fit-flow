import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  LoggedExercise,
  WorkoutLog,
  WorkoutLogEntity,
} from "@/lib/db/types";
import { compareByDate } from "@/lib/utils/date";
import { hardDeleteEntity, putEntityWithSync, updateEntity } from "./entity-crud";
import { attachExercises, getExerciseMap } from "./exercises";
import { enqueueDraftWrite } from "./drafts";

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

export async function saveWorkoutEdits(
  id: string,
  exercises: LoggedExercise[]
): Promise<WorkoutLogEntity | undefined> {
  return updateEntity(db.workoutLogs, "workoutLog", id, { exercises });
}

export async function removeWorkoutLog(id: string): Promise<void> {
  await hardDeleteEntity(db.workoutLogs, "workoutLog", id);
}

/** Await pending set edits, then commit the log, outbox and draft removal together. */
export function finishWorkout(
  activeWorkoutId: string,
  details: Pick<WorkoutLog, "endedAt" | "programId" | "programName" | "sessionName">
): Promise<WorkoutLogEntity> {
  return enqueueDraftWrite(() => db.transaction(
    "rw", db.workoutDrafts, db.workoutLogs, db.syncQueue, async () => {
      const draft = await db.workoutDrafts.get("active");
      const existing = await db.workoutLogs.get(activeWorkoutId);
      if (existing) {
        if (draft?.activeWorkoutId === activeWorkoutId) await db.workoutDrafts.delete("active");
        return existing;
      }
      if (!draft?.startedAt || draft.activeWorkoutId !== activeWorkoutId) {
        throw new Error("Workout draft no longer available");
      }
      const log: WorkoutLogEntity = {
        ...details,
        id: activeWorkoutId,
        startedAt: draft.startedAt,
        sessionId: draft.sessionId ?? undefined,
        exercises: draft.exercises.map((exercise) => ({ ...exercise, workoutLogId: activeWorkoutId })),
        revision: 1,
        updatedAt: new Date().toISOString(),
      };
      await putEntityWithSync(db.workoutLogs, "workoutLog", log, "create");
      await db.workoutDrafts.delete("active");
      return log;
    }
  ));
}
