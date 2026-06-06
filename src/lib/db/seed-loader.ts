import { db, getAppMeta, setAppMeta } from "./dexie";
import { programs } from "./seed";
import type { ProgramEntity } from "./types";

const LIBRARY_SCHEMA_VERSION = 3;

const LEGACY_EXERCISE_ID = /^ex\d+$/;

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

async function hasLegacyProgramExerciseIds(): Promise<boolean> {
  const rows = await db.programs.toArray();
  return rows.some((p) =>
    p.sessions.some((s) =>
      s.exercises.some((e) => LEGACY_EXERCISE_ID.test(e.exerciseId))
    )
  );
}

export async function ensureSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  await runLibraryMigration();
  const meta = await getAppMeta();
  if (meta?.initialized) return;
  const count = await db.programs.count();
  if (count > 0) return;
  await getSeedPromise();
}

async function runLibraryMigration(): Promise<void> {
  const meta = await getAppMeta();
  const legacyPrograms = await hasLegacyProgramExerciseIds();
  const versionBump = meta.schemaVersion < LIBRARY_SCHEMA_VERSION;

  if (!versionBump && !legacyPrograms) return;

  if (versionBump) {
    await db.transaction(
      "rw",
      [
        db.exercises,
        db.programs,
        db.workoutLogs,
        db.personalRecords,
        db.workoutDrafts,
        db.meta,
      ],
      async () => {
        await db.exercises.clear();
        await db.workoutLogs.clear();
        await db.personalRecords.clear();
        await db.workoutDrafts.clear();
        await db.programs.clear();
      }
    );
  } else if (legacyPrograms) {
    await db.programs.clear();
  }

  delete globalThis.__fitflow_seed_promise__;
  await setAppMeta({ schemaVersion: LIBRARY_SCHEMA_VERSION });
  await doSeed();
}

async function doSeed(): Promise<void> {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const programRows: ProgramEntity[] = programs.map((p) => ({
    ...p,
    revision: 1,
    updatedAt: now,
  }));

  const existingPrograms = await db.programs.count();
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
  await setAppMeta({ schemaVersion: LIBRARY_SCHEMA_VERSION });
  await doSeed();
}
