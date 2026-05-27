import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Exercise,
  WorkoutProgram,
  WorkoutLog,
  BodyMeasurement,
  PersonalRecord,
  CardioSession,
} from "./types";
import {
  exercises as seedExercises,
  programs as seedPrograms,
  workoutLogs as seedWorkoutLogs,
  bodyMeasurements as seedBodyMeasurements,
  personalRecords as seedPersonalRecords,
  cardioSessions as seedCardioSessions,
} from "./seed";

export interface FitFlowDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
  };
  programs: {
    key: string;
    value: WorkoutProgram;
  };
  workoutLogs: {
    key: string;
    value: WorkoutLog;
    indexes: { "by-startedAt": string };
  };
  bodyMeasurements: {
    key: string;
    value: BodyMeasurement;
    indexes: { "by-date": string };
  };
  personalRecords: {
    key: string;
    value: PersonalRecord;
  };
  cardioSessions: {
    key: string;
    value: CardioSession;
    indexes: { "by-date": string };
  };
}

let dbPromise: Promise<IDBPDatabase<FitFlowDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FitFlowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FitFlowDB>("fitflow", 1, {
      upgrade(db) {
        db.createObjectStore("exercises", { keyPath: "id" });
        db.createObjectStore("programs", { keyPath: "id" });

        const logStore = db.createObjectStore("workoutLogs", { keyPath: "id" });
        logStore.createIndex("by-startedAt", "startedAt");

        const bmStore = db.createObjectStore("bodyMeasurements", { keyPath: "id" });
        bmStore.createIndex("by-date", "date");

        db.createObjectStore("personalRecords", { keyPath: "id" });

        const cardioStore = db.createObjectStore("cardioSessions", { keyPath: "id" });
        cardioStore.createIndex("by-date", "date");
      },
    });
  }
  return dbPromise;
}

export async function seedIfEmpty(): Promise<void> {
  const db = await getDB();

  const exerciseCount = await db.count("exercises");
  if (exerciseCount > 0) return;

  const tx = db.transaction(
    ["exercises", "programs", "workoutLogs", "bodyMeasurements", "personalRecords", "cardioSessions"],
    "readwrite",
  );

  const ops: Promise<unknown>[] = [];
  for (const e of seedExercises) ops.push(tx.objectStore("exercises").put(e));
  for (const p of seedPrograms) ops.push(tx.objectStore("programs").put(p));
  for (const l of seedWorkoutLogs) ops.push(tx.objectStore("workoutLogs").put(l));
  for (const m of seedBodyMeasurements) ops.push(tx.objectStore("bodyMeasurements").put(m));
  for (const r of seedPersonalRecords) ops.push(tx.objectStore("personalRecords").put(r));
  for (const c of seedCardioSessions) ops.push(tx.objectStore("cardioSessions").put(c));

  ops.push(tx.done);
  await Promise.all(ops);
}
