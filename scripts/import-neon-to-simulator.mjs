#!/usr/bin/env node
// Pull live FitFlow rows from Neon Postgres into the booted iOS simulator's
// expo-sqlite file. Does not enqueue sync — the import is treated as already
// on the server (sets lastPullAt / syncInitialized).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function iso(value) {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function compact(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

function simulatorDbPath() {
  const dataRoot = execFileSync("xcrun", ["simctl", "get_app_container", "booted", "com.roxvell.fitflow", "data"], {
    encoding: "utf8",
  }).trim();
  const found = execFileSync("find", [dataRoot, "-name", "fitflow.db"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  if (found.length === 0) {
    throw new Error(`fitflow.db not found under ${dataRoot}. Launch the app once first.`);
  }
  return found[0];
}

loadEnv();
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const [programs, workoutLogs, measurements, cardio, records] = await Promise.all([
  sql`SELECT * FROM programs WHERE deleted_at IS NULL`,
  sql`SELECT * FROM workout_logs WHERE deleted_at IS NULL`,
  sql`SELECT * FROM body_measurements WHERE deleted_at IS NULL`,
  sql`SELECT * FROM cardio_sessions WHERE deleted_at IS NULL`,
  sql`SELECT * FROM personal_records WHERE deleted_at IS NULL`,
]);

const dump = {
  programs: programs.map((row) =>
    compact({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      daysPerWeek: row.days_per_week,
      isActive: row.is_active,
      createdAt: iso(row.created_at),
      sessions: row.sessions ?? [],
      restDurationSeconds: row.rest_duration_seconds,
      revision: row.revision,
      updatedAt: iso(row.updated_at),
    }),
  ),
  workoutLogs: workoutLogs.map((row) =>
    compact({
      id: row.id,
      startedAt: iso(row.started_at),
      endedAt: iso(row.ended_at),
      programId: row.program_id,
      sessionId: row.session_id,
      programName: row.program_name,
      sessionName: row.session_name,
      notes: row.notes,
      exercises: row.exercises ?? [],
      revision: row.revision,
      updatedAt: iso(row.updated_at),
    }),
  ),
  measurements: measurements.map((row) =>
    compact({
      id: row.id,
      date: iso(row.date),
      weight: row.weight,
      bodyFat: row.body_fat,
      chest: row.chest,
      waist: row.waist,
      leftArm: row.left_arm,
      rightArm: row.right_arm,
      leftThigh: row.left_thigh,
      rightThigh: row.right_thigh,
      leftCalf: row.left_calf,
      rightCalf: row.right_calf,
      revision: row.revision,
      updatedAt: iso(row.updated_at),
    }),
  ),
  cardio: cardio.map((row) =>
    compact({
      id: row.id,
      type: row.type,
      distance: row.distance,
      duration: row.duration,
      avgHeartRate: row.avg_heart_rate,
      workoutLogId: row.workout_log_id,
      date: iso(row.date),
      revision: row.revision,
      updatedAt: iso(row.updated_at),
    }),
  ),
  records: records.map((row) =>
    compact({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      type: row.type,
      value: row.value,
      date: iso(row.date),
      workoutLogId: row.workout_log_id,
      revision: row.revision,
      updatedAt: iso(row.updated_at),
    }),
  ),
};

const pulledAt = new Date().toISOString();
try {
  execFileSync("xcrun", ["simctl", "terminate", "booted", "com.roxvell.fitflow"], { stdio: "ignore" });
} catch {
  // already stopped
}

const dbPath = simulatorDbPath();
const python = `
import json, sqlite3, sys
dump = json.load(sys.stdin)
db = sqlite3.connect(sys.argv[1])
db.execute("PRAGMA foreign_keys = OFF")
cur = db.cursor()
cur.execute("DELETE FROM programs")
cur.execute("DELETE FROM workout_logs")
cur.execute("DELETE FROM body_measurements")
cur.execute("DELETE FROM cardio_sessions")
cur.execute("DELETE FROM personal_records")
cur.execute("DELETE FROM workout_drafts")
cur.execute("DELETE FROM sync_queue")

def put(sql, rows):
    cur.executemany(sql, rows)

put(
    "INSERT INTO programs (id, is_active, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)",
    [(p["id"], 1 if p.get("isActive") else 0, p["updatedAt"], json.dumps(p)) for p in dump["programs"]],
)
put(
    "INSERT INTO workout_logs (id, started_at, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)",
    [(r["id"], r["startedAt"], r["updatedAt"], json.dumps(r)) for r in dump["workoutLogs"]],
)
put(
    "INSERT INTO body_measurements (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)",
    [(r["id"], r["date"], r["updatedAt"], json.dumps(r)) for r in dump["measurements"]],
)
put(
    "INSERT INTO cardio_sessions (id, date, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)",
    [(r["id"], r["date"], r["updatedAt"], json.dumps(r)) for r in dump["cardio"]],
)
put(
    "INSERT INTO personal_records (id, exercise_id, updated_at, deleted_at, data) VALUES (?, ?, ?, NULL, ?)",
    [(r["id"], r["exerciseId"], r["updatedAt"], json.dumps(r)) for r in dump["records"]],
)
for key, value in (("lastPullAt", sys.argv[2]), ("lastSyncAt", sys.argv[2]), ("syncInitialized", "1"), ("initialized", "1")):
    cur.execute("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", (key, value))
db.commit()
print(json.dumps({
    "db": sys.argv[1],
    "programs": len(dump["programs"]),
    "workoutLogs": len(dump["workoutLogs"]),
    "measurements": len(dump["measurements"]),
    "cardio": len(dump["cardio"]),
    "records": len(dump["records"]),
}))
`;

const result = execFileSync("python3", ["-c", python, dbPath, pulledAt], {
  input: JSON.stringify(dump),
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});
process.stdout.write(result);
