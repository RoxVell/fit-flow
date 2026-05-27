import { openDB, type IDBPDatabase } from "idb";
import type { WorkoutLog, CardioSession, BodyMeasurement } from "./types";
import type { PersistStorage } from "zustand/middleware";

const DB_NAME = "fitflow";
const DB_VERSION = 2;

type StoreName = "workoutLogs" | "cardioSessions" | "bodyMeasurements" | "kv";

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains("workoutLogs")) {
          db.createObjectStore("workoutLogs", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cardioSessions")) {
          db.createObjectStore("cardioSessions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("bodyMeasurements")) {
          db.createObjectStore("bodyMeasurements", { keyPath: "id" });
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      }
    },
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDb();
  return db.getAll(store);
}

export async function add<T>(store: StoreName, value: T): Promise<void> {
  const db = await getDb();
  await db.add(store, value);
}

export async function put<T>(store: StoreName, value: T): Promise<void> {
  const db = await getDb();
  await db.put(store, value);
}

export async function del(store: StoreName, key: string): Promise<void> {
  const db = await getDb();
  await db.delete(store, key);
}

export async function clear(store: StoreName): Promise<void> {
  const db = await getDb();
  await db.clear(store);
}

export const localDb = {
  workoutLogs: {
    getAll: () => getAll<WorkoutLog>("workoutLogs"),
    add: (log: WorkoutLog) => add<WorkoutLog>("workoutLogs", log),
    delete: (id: string) => del("workoutLogs", id),
  },
  cardioSessions: {
    getAll: () => getAll<CardioSession>("cardioSessions"),
    add: (session: CardioSession) => add<CardioSession>("cardioSessions", session),
  },
  bodyMeasurements: {
    getAll: () => getAll<BodyMeasurement>("bodyMeasurements"),
    add: (m: BodyMeasurement) => add<BodyMeasurement>("bodyMeasurements", m),
  },
};

export const zustandStorage: PersistStorage<unknown> = {
  getItem: async (name: string) => {
    const db = await getDb();
    const value = await db.get("kv", name);
    return value ?? null;
  },
  setItem: async (name: string, value: unknown) => {
    const db = await getDb();
    await db.put("kv", value, name);
  },
  removeItem: async (name: string) => {
    const db = await getDb();
    await db.delete("kv", name);
  },
};
