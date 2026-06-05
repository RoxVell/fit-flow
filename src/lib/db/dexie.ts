import Dexie, { type Table } from "dexie";
import type {
  AppMeta,
  BodyMeasurementEntity,
  CardioSessionEntity,
  ExerciseEntity,
  PersonalRecordEntity,
  ProgramEntity,
  SyncQueueEntry,
  WorkoutDraft,
  WorkoutLogEntity,
} from "./types";

export class FitFlowDB extends Dexie {
  exercises!: Table<ExerciseEntity, string>;
  programs!: Table<ProgramEntity, string>;
  workoutLogs!: Table<WorkoutLogEntity, string>;
  bodyMeasurements!: Table<BodyMeasurementEntity, string>;
  cardioSessions!: Table<CardioSessionEntity, string>;
  personalRecords!: Table<PersonalRecordEntity, string>;
  syncQueue!: Table<SyncQueueEntry, string>;
  workoutDrafts!: Table<WorkoutDraft, string>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super("fitflow_v2");
    this.version(1).stores({
      exercises: "id",
      programs: "id, isActive, updatedAt",
      workoutLogs: "id, startedAt, updatedAt",
      bodyMeasurements: "id, date, updatedAt",
      cardioSessions: "id, date, updatedAt",
      personalRecords: "id, exerciseId, updatedAt",
      syncQueue: "id, entityId, status, createdAt",
      workoutDrafts: "id",
      meta: "key",
    });
  }
}

export const db = new FitFlowDB();

const DEFAULT_META: AppMeta = {
  key: "app",
  initialized: false,
  lastPullAt: null,
  lastSyncAt: null,
  schemaVersion: 1,
};

export async function getAppMeta(): Promise<AppMeta> {
  const row = await db.meta.get("app");
  return row ?? DEFAULT_META;
}

export async function setAppMeta(patch: Partial<Omit<AppMeta, "key">>): Promise<void> {
  const current = await getAppMeta();
  await db.meta.put({ ...current, ...patch, key: "app" });
}

function withSyncFields<T extends object>(entity: T, now = new Date().toISOString()) {
  return {
    ...entity,
    revision: 1,
    updatedAt: now,
  };
}

/** One-time import from legacy idb database `fitflow` v1 */
export async function migrateFromLegacyIdb(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const total =
    (await db.exercises.count()) +
    (await db.programs.count()) +
    (await db.workoutLogs.count());
  if (total > 0) return;

  return new Promise((resolve) => {
    const request = indexedDB.open("fitflow", 1);
    request.onerror = () => resolve();
    request.onsuccess = async () => {
      const legacy = request.result;
      try {
        const now = new Date().toISOString();
        const readAll = <T>(store: string): Promise<T[]> =>
          new Promise((res, rej) => {
            if (!legacy.objectStoreNames.contains(store)) {
              res([]);
              return;
            }
            const tx = legacy.transaction(store, "readonly");
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => res(req.result as T[]);
            req.onerror = () => rej(req.error);
          });

        const [exercises, programs, workoutLogs, bodyMeasurements, cardioSessions, personalRecords] =
          await Promise.all([
            readAll<ExerciseEntity>("exercises"),
            readAll<ProgramEntity>("programs"),
            readAll<WorkoutLogEntity>("workoutLogs"),
            readAll<BodyMeasurementEntity>("bodyMeasurements"),
            readAll<CardioSessionEntity>("cardioSessions"),
            readAll<PersonalRecordEntity>("personalRecords"),
          ]);

        await db.transaction(
          "rw",
          [
            db.exercises,
            db.programs,
            db.workoutLogs,
            db.bodyMeasurements,
            db.cardioSessions,
            db.personalRecords,
            db.meta,
          ],
          async () => {
            if (exercises.length) {
              await db.exercises.bulkPut(exercises.map((e) => withSyncFields(e, now)));
            }
            if (programs.length) {
              await db.programs.bulkPut(programs.map((p) => withSyncFields(p, now)));
            }
            if (workoutLogs.length) {
              await db.workoutLogs.bulkPut(workoutLogs.map((l) => withSyncFields(l, now)));
            }
            if (bodyMeasurements.length) {
              await db.bodyMeasurements.bulkPut(
                bodyMeasurements.map((m) => withSyncFields(m, now))
              );
            }
            if (cardioSessions.length) {
              await db.cardioSessions.bulkPut(
                cardioSessions.map((c) => withSyncFields(c, now))
              );
            }
            if (personalRecords.length) {
              await db.personalRecords.bulkPut(
                personalRecords.map((r) => withSyncFields(r, now))
              );
            }
          }
        );
      } finally {
        legacy.close();
        resolve();
      }
    };
  });
}
