import { openDB, type DBSchema, type IDBPDatabase, type StoreNames } from "idb";
import type {
  Exercise,
  WorkoutProgram,
  WorkoutLog,
  BodyMeasurement,
  PersonalRecord,
  CardioSession,
} from "./types";

export interface OutboxEntry {
  id: string;
  name: string;
  args: unknown[];
  createdAt: number;
  retries: number;
  lastError?: string;
}

interface FitFlowDB extends DBSchema {
  exercises: { key: string; value: Exercise };
  programs: {
    key: string;
    value: WorkoutProgram;
    indexes: { "by-active": number };
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
  cardioSessions: {
    key: string;
    value: CardioSession;
    indexes: { "by-date": string };
  };
  personalRecords: {
    key: string;
    value: PersonalRecord;
    indexes: { "by-exerciseId": string };
  };
  outbox: {
    key: string;
    value: OutboxEntry;
    indexes: { "by-createdAt": number };
  };
  meta: { key: string; value: { key: string; value: unknown } };
}

const DB_NAME = "fitflow";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FitFlowDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FitFlowDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<FitFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("exercises")) {
          db.createObjectStore("exercises", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("programs")) {
          const programs = db.createObjectStore("programs", { keyPath: "id" });
          programs.createIndex("by-active", "isActive");
        }
        if (!db.objectStoreNames.contains("workoutLogs")) {
          const store = db.createObjectStore("workoutLogs", { keyPath: "id" });
          store.createIndex("by-startedAt", "startedAt");
        }
        if (!db.objectStoreNames.contains("bodyMeasurements")) {
          const store = db.createObjectStore("bodyMeasurements", { keyPath: "id" });
          store.createIndex("by-date", "date");
        }
        if (!db.objectStoreNames.contains("cardioSessions")) {
          const store = db.createObjectStore("cardioSessions", { keyPath: "id" });
          store.createIndex("by-date", "date");
        }
        if (!db.objectStoreNames.contains("personalRecords")) {
          const store = db.createObjectStore("personalRecords", { keyPath: "id" });
          store.createIndex("by-exerciseId", "exerciseId");
        }
        if (!db.objectStoreNames.contains("outbox")) {
          const store = db.createObjectStore("outbox", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export type StoreName = Exclude<StoreNames<FitFlowDB>, "meta">;

export async function idbGetAll<S extends StoreName>(
  store: S
): Promise<FitFlowDB[S]["value"][]> {
  const db = await getDB();
  return (await db.getAll(store)) as FitFlowDB[S]["value"][];
}

export async function idbGet<S extends StoreName>(
  store: S,
  key: string
): Promise<FitFlowDB[S]["value"] | undefined> {
  const db = await getDB();
  return (await db.get(store, key)) as FitFlowDB[S]["value"] | undefined;
}

export async function idbPut<S extends StoreName>(
  store: S,
  value: FitFlowDB[S]["value"]
): Promise<void> {
  const db = await getDB();
  await db.put(store, value as never);
}

export async function idbBulkPut<S extends StoreName>(
  store: S,
  values: FitFlowDB[S]["value"][]
): Promise<void> {
  if (values.length === 0) return;
  const db = await getDB();
  const tx = db.transaction(store, "readwrite");
  await Promise.all(values.map((v) => tx.store.put(v as never)));
  await tx.done;
}

export async function idbDelete<S extends StoreName>(
  store: S,
  key: string
): Promise<void> {
  const db = await getDB();
  await db.delete(store, key);
}

export async function idbClearAll(): Promise<void> {
  const db = await getDB();
  const stores: StoreName[] = [
    "exercises",
    "programs",
    "workoutLogs",
    "bodyMeasurements",
    "cardioSessions",
    "personalRecords",
    "outbox",
  ];
  const tx = db.transaction(stores, "readwrite");
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()));
  await tx.done;
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const row = await db.get("meta", key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("meta", { key, value });
}

export type { FitFlowDB };
