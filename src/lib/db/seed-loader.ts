import { db } from "./dexie";
import { exercises, programs } from "./seed";
import type {
  ExerciseEntity,
  ProgramEntity,
} from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __fitflow_seed_promise__: Promise<void> | undefined;
}

function getSeedPromise(): Promise<void> {
  if (globalThis.__fitflow_seed_promise__) {
    return globalThis.__fitflow_seed_promise__;
  }
  const p = doSeed();
  globalThis.__fitflow_seed_promise__ = p;
  return p;
}

export async function ensureSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  const meta = await db.meta.get("app");
  if (meta?.initialized) return;
  const count = await db.exercises.count();
  if (count > 0) return;
  await getSeedPromise();
}

async function doSeed(): Promise<void> {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const exerciseRows: ExerciseEntity[] = exercises.map((e) => ({
    ...e,
    revision: 1,
    updatedAt: now,
  }));
  const programRows: ProgramEntity[] = programs.map((p) => ({
    ...p,
    revision: 1,
    updatedAt: now,
  }));

  const existingExercises = await db.exercises.count();
  const existingPrograms = await db.programs.count();
  if (existingExercises === 0) {
    await db.exercises.bulkPut(exerciseRows);
  }
  if (existingPrograms === 0) {
    await db.programs.bulkPut(programRows);
  }
}

export async function resetAllData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.exercises,
      db.programs,
      db.workoutLogs,
      db.bodyMeasurements,
      db.cardioSessions,
      db.personalRecords,
      db.syncQueue,
      db.workoutDrafts,
      db.meta,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.programs.clear(),
        db.workoutLogs.clear(),
        db.bodyMeasurements.clear(),
        db.cardioSessions.clear(),
        db.personalRecords.clear(),
        db.syncQueue.clear(),
        db.workoutDrafts.clear(),
        db.meta.clear(),
      ]);
    }
  );
  delete globalThis.__fitflow_seed_promise__;
  await doSeed();
}
