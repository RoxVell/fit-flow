import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import { programs as seedPrograms } from "./seed";
import type { ProgramEntity } from "./types";

// Document-style storage mirroring the web app's Dexie stores: each row keeps
// the full entity as JSON plus a few indexed columns for filtering/sorting.
export const TABLES = {
  programs: "programs",
  workoutLogs: "workout_logs",
  bodyMeasurements: "body_measurements",
  cardioSessions: "cardio_sessions",
  personalRecords: "personal_records",
  workoutDrafts: "workout_drafts",
  syncQueue: "sync_queue",
  meta: "meta",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

const SCHEMA_VERSION = 2;

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS ${TABLES.programs} (
    id TEXT PRIMARY KEY NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.workoutLogs} (
    id TEXT PRIMARY KEY NOT NULL,
    started_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.bodyMeasurements} (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.cardioSessions} (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.personalRecords} (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.workoutDrafts} (
    id TEXT PRIMARY KEY NOT NULL,
    updated_at TEXT NOT NULL,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.syncQueue} (
    id TEXT PRIMARY KEY NOT NULL,
    entity_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ${TABLES.meta} (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

let instance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!instance) {
    instance = openDatabaseSync("fitflow.db", { enableChangeListener: true });
    instance.execSync(SCHEMA);
    migrate(instance);
    seed(instance);
  }
  return instance;
}

export function getMeta(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    `SELECT value FROM ${TABLES.meta} WHERE key = ?`,
    key,
  );
  return row?.value ?? null;
}

export function setMeta(key: string, value: string) {
  getDb().runSync(
    `INSERT INTO ${TABLES.meta} (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

function migrate(db: SQLiteDatabase) {
  const current = Number(
    db.getFirstSync<{ value: string }>(`SELECT value FROM ${TABLES.meta} WHERE key = 'schemaVersion'`)
      ?.value ?? 0,
  );
  if (current < 2) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.syncQueue} (
        id TEXT PRIMARY KEY NOT NULL,
        entity_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }
  if (current >= SCHEMA_VERSION) return;
  db.runSync(
    `INSERT OR REPLACE INTO ${TABLES.meta} (key, value) VALUES ('schemaVersion', ?)`,
    String(SCHEMA_VERSION),
  );
}

function seed(db: SQLiteDatabase) {
  const seeded = db.getFirstSync<{ value: string }>(
    `SELECT value FROM ${TABLES.meta} WHERE key = 'initialized'`,
  );
  if (seeded?.value === "1") return;
  const count = db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${TABLES.programs}`);
  if ((count?.n ?? 0) === 0) {
    const now = new Date().toISOString();
    db.withTransactionSync(() => {
      for (const program of seedPrograms) {
        const entity: ProgramEntity = { ...program, revision: 1, updatedAt: now };
        db.runSync(
          `INSERT INTO ${TABLES.programs} (id, is_active, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)`,
          entity.id,
          entity.isActive ? 1 : 0,
          entity.updatedAt,
          JSON.stringify(entity),
        );
      }
    });
  }
  db.runSync(`INSERT OR REPLACE INTO ${TABLES.meta} (key, value) VALUES ('initialized', '1')`);
}
