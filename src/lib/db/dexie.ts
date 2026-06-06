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

