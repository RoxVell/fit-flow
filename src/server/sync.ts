import { lt } from "drizzle-orm";
import { getDb } from "./db";
import { bodyMeasurements, cardioSessions, programs, workoutLogs } from "./db/schema";
import { ensureServerSeeded } from "./db/seed";
import type { BodyMeasurement, CardioSession, EntityType, WorkoutLog, WorkoutProgram } from "@/lib/db/types";
import type { ServerChange, SyncChange, SyncResponse } from "@/lib/sync/types";

type SyncTable = typeof programs | typeof workoutLogs | typeof bodyMeasurements | typeof cardioSessions;

/** The revision check belongs in the write itself, under PostgreSQL's row lock. */
export function buildUpsert<T extends SyncTable>(table: T, values: T["$inferInsert"], revision: number) {
  const set = Object.fromEntries(Object.entries(values).filter(
    ([key, value]) => key !== "id" && key !== "createdAt" && value !== undefined &&
      (!values.deletedAt || ["revision", "updatedAt", "deletedAt"].includes(key))
  ));
  // All tables share these sync columns. The actual table remains unchanged.
  const t = table as typeof programs;
  return getDb().insert(t).values(values as typeof programs.$inferInsert)
    .onConflictDoUpdate({ target: t.id, set, setWhere: lt(t.revision, revision) })
    .returning({ id: t.id });
}

async function applyChange(change: SyncChange): Promise<boolean> {
  const now = new Date().toISOString();
  const deleted = change.operation === "delete";
  const common = { id: change.entityId, revision: change.revision, updatedAt: now, deletedAt: deleted ? now : null };
  let result: { id: string }[];
  // Minimal tombstone rows also protect an ID deleted before its first upload.
  switch (change.entityType) {
    case "program": {
      const p = change.payload as WorkoutProgram;
      result = await buildUpsert(programs, {
        ...(deleted ? { name: "", description: "", daysPerWeek: 0, isActive: false, createdAt: now, sessions: [] } : {
          name: p.name, description: p.description, daysPerWeek: p.daysPerWeek,
          isActive: p.isActive, createdAt: p.createdAt, sessions: p.sessions,
          restDurationSeconds: p.restDurationSeconds,
        }), ...common,
      }, change.revision);
      break;
    }
    case "workoutLog": {
      const p = change.payload as WorkoutLog;
      result = await buildUpsert(workoutLogs, {
        ...(deleted ? { startedAt: now, exercises: [] } : {
          startedAt: p.startedAt, endedAt: p.endedAt ?? null,
          programId: p.programId ?? null, sessionId: p.sessionId ?? null,
          programName: p.programName ?? null, sessionName: p.sessionName ?? null,
          notes: p.notes ?? null, exercises: p.exercises,
        }), ...common,
      }, change.revision);
      break;
    }
    case "bodyMeasurement": {
      const p = change.payload as BodyMeasurement;
      result = await buildUpsert(bodyMeasurements, {
        ...(deleted ? { date: now } : {
          date: p.date, weight: p.weight ?? null, bodyFat: p.bodyFat ?? null,
          chest: p.chest ?? null, waist: p.waist ?? null,
          leftArm: p.leftArm ?? null, rightArm: p.rightArm ?? null,
          leftThigh: p.leftThigh ?? null, rightThigh: p.rightThigh ?? null,
          leftCalf: p.leftCalf ?? null, rightCalf: p.rightCalf ?? null,
        }), ...common,
      }, change.revision);
      break;
    }
    case "cardioSession": {
      const p = change.payload as CardioSession;
      result = await buildUpsert(cardioSessions, {
        ...(deleted ? { type: "run" as const, date: now, distance: 0, duration: 0 } : {
          type: p.type, date: p.date, distance: p.distance, duration: p.duration,
          avgHeartRate: p.avgHeartRate ?? null, workoutLogId: p.workoutLogId ?? null,
        }), ...common,
      }, change.revision);
      break;
    }
    default: throw new Error("Unsupported entity type");
  }
  return result.length > 0;
}

/** SQL nulls represent the optional fields that the client stores as undefined. */
export function toServerChanges(entityType: EntityType, rows: { revision: number }[]): ServerChange[] {
  const timestamps = new Set(["createdAt", "startedAt", "endedAt", "date", "updatedAt", "deletedAt"]);
  return rows.map((row) => ({
    entityType, revision: row.revision,
    entity: Object.fromEntries(Object.entries(row)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, timestamps.has(key) ? new Date(String(value)).toISOString() : value])),
  }));
}

async function pullAll(): Promise<ServerChange[]> {
  const db = getDb();
  const [programRows, logRows, measurementRows, cardioRows] = await Promise.all([
    db.select().from(programs), db.select().from(workoutLogs),
    db.select().from(bodyMeasurements), db.select().from(cardioSessions),
  ]);
  return [
    ...toServerChanges("program", programRows), ...toServerChanges("workoutLog", logRows),
    ...toServerChanges("bodyMeasurement", measurementRows), ...toServerChanges("cardioSession", cardioRows),
  ];
}

export async function handleSync(changes: SyncChange[]): Promise<SyncResponse> {
  await ensureServerSeeded();
  const accepted: string[] = [];
  const superseded: string[] = [];
  const rejected: SyncResponse["rejected"] = [];
  for (const change of changes) {
    try {
      (await applyChange(change) ? accepted : superseded).push(change.id);
    } catch (error) {
      console.error("[sync] write failed", error);
      rejected.push({ id: change.id, reason: "Unable to save change; will retry" });
    }
  }
  // A full pull includes tombstones and cannot permanently skip a concurrent
  // write behind a timestamp cursor. A write during this pull arrives next time.
  const serverChanges = await pullAll();
  return { accepted, superseded, rejected, serverChanges, serverTime: new Date().toISOString() };
}
