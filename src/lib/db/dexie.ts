import Dexie, { type Table } from "dexie";
import type {
  AppMeta,
  BodyMeasurementEntity,
  CardioSessionEntity,
  Exercise,
  ExerciseReplacement,
  ProgramEntity,
  SyncQueueEntry,
  WorkoutDraft,
  WorkoutLogEntity,
} from "./types";
import { generateId } from "@/lib/utils/id";

export class FitFlowDB extends Dexie {
  programs!: Table<ProgramEntity, string>;
  workoutLogs!: Table<WorkoutLogEntity, string>;
  bodyMeasurements!: Table<BodyMeasurementEntity, string>;
  cardioSessions!: Table<CardioSessionEntity, string>;
  syncQueue!: Table<SyncQueueEntry, string>;
  workoutDrafts!: Table<WorkoutDraft, string>;
  exerciseReplacements!: Table<ExerciseReplacement, [string, string]>;
  meta!: Table<AppMeta, string>;

  constructor(name = "fitflow_v2") {
    super(name);
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
    this.version(2).stores({
      exerciseReplacements: "[fromExerciseId+toExerciseId], fromExerciseId",
    });
    // Embed legacy descriptions; keep their source archived if a server conflict replaces a snapshot.
    // Existing PR rows stay archived in personalRecords; the UI derives PRs from logs.
    this.version(3).stores({}).upgrade(async (tx) => {
      const catalog = new Map<string, Exercise>(
        (await tx.table("exercises").toArray()).map((exercise) => [exercise.id, exercise])
      );
      const attach = <T extends { exerciseId: string; exercise?: Exercise }>(entries: T[]): T[] =>
        entries.map((entry) => ({ ...entry, exercise: entry.exercise ?? catalog.get(entry.exerciseId) }));
      const updatedAt = new Date().toISOString();
      for (const [tableName, entityType] of [["programs", "program"], ["workoutLogs", "workoutLog"]] as const) {
        const table = tx.table(tableName);
        for (const row of await table.toArray()) {
          const entries = tableName === "programs" ? row.sessions.flatMap((session: { exercises: { exerciseId: string; exercise?: Exercise }[] }) => session.exercises) : row.exercises;
          if (!entries.some((entry: { exerciseId: string; exercise?: Exercise }) => !entry.exercise && catalog.has(entry.exerciseId))) continue;
          const entity = {
            ...row,
            ...(tableName === "programs"
              ? { sessions: row.sessions.map((session: { exercises: { exerciseId: string; exercise?: Exercise }[] }) => ({ ...session, exercises: attach(session.exercises) })) }
              : { exercises: attach(row.exercises) }),
            revision: row.revision + 1,
            updatedAt,
          };
          await table.put(entity);
          if (!row.deletedAt) await tx.table("syncQueue").put({
            id: generateId(), entityType, entityId: row.id, operation: "update",
            payload: entity, revision: entity.revision, createdAt: updatedAt, status: "pending",
          });
        }
      }
      await tx.table("workoutDrafts").toCollection().modify((draft) => {
        draft.exercises = attach(draft.exercises);
        if (draft.activeWorkoutId && draft.activeWorkoutId === draft.sessionId) draft.activeWorkoutId = generateId();
      });
      await tx.table("syncQueue").filter((entry) =>
        entry.entityType === "exercise" || entry.entityType === "personalRecord"
      ).delete();
    });
    this.version(4).stores({ exercises: "id" });
  }
}

export const db = new FitFlowDB();

const DEFAULT_META: AppMeta = {
  key: "app",
  initialized: false,
  lastPullAt: null,
  lastSyncAt: null,
};

export async function getAppMeta(): Promise<AppMeta> {
  const row = await db.meta.get("app");
  return row ?? DEFAULT_META;
}

export async function setAppMeta(patch: Partial<Omit<AppMeta, "key">>): Promise<void> {
  const current = await getAppMeta();
  await db.meta.put({ ...current, ...patch, key: "app" });
}

