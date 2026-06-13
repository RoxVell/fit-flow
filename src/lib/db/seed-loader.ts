import { db, getAppMeta, setAppMeta } from "./dexie";
import { programs } from "./seed";
import type { ProgramEntity } from "./types";

const LIBRARY_SCHEMA_VERSION = 3;

declare global {
  var __fitflow_seed_promise__: Promise<void> | undefined;
  var __fitflow_migration_promise__: Promise<void> | undefined;
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
  await runLibraryMigration();
  const meta = await getAppMeta();
  if (meta?.initialized) return;
  const count = await db.programs.count();
  if (count > 0) return;
  await getSeedPromise();
}

async function runLibraryMigration(): Promise<void> {
  // Coalesce concurrent callers. The migration does a destructive
  // `clear()` followed by a `bulkPut`; if two callers run in parallel
  // they can both observe a stale `meta.schemaVersion < 3`, both clear
  // the data, and the test suite (or any caller that wrote between
  // the two migrations) loses its writes. Sharing a single promise
  // ensures at most one migration runs at a time.
  if (globalThis.__fitflow_migration_promise__) {
    return globalThis.__fitflow_migration_promise__;
  }
  const promise = (async () => {
    const meta = await getAppMeta();
    if (meta.schemaVersion >= LIBRARY_SCHEMA_VERSION) return;

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

    delete globalThis.__fitflow_seed_promise__;
    await setAppMeta({ schemaVersion: LIBRARY_SCHEMA_VERSION });
    await doSeed();
  })();
  globalThis.__fitflow_migration_promise__ = promise;
  try {
    await promise;
  } finally {
    globalThis.__fitflow_migration_promise__ = undefined;
  }
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