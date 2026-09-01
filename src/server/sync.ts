import { and, eq, gt, isNotNull, isNull, or, type AnyColumn } from "drizzle-orm";
import { db } from "./db";
import {
  bodyMeasurements,
  cardioSessions,
  exercises,
  personalRecords,
  programs,
  workoutLogs,
} from "./db/schema";
import type { EntityType } from "@/lib/db/types";
import type { ServerChange, SyncChange, SyncResponse } from "@/lib/sync/types";
import { ensureServerSeeded } from "./db/seed";

const ENTITY_TABLES = {
  exercise: exercises,
  program: programs,
  workoutLog: workoutLogs,
  bodyMeasurement: bodyMeasurements,
  cardioSession: cardioSessions,
  personalRecord: personalRecords,
} as const;

type SyncTable = (typeof ENTITY_TABLES)[EntityType];

/**
 * All sync tables share the id/revision/updatedAt/deletedAt columns; a
 * single-table cast keeps drizzle's fluent builder types workable where only
 * those shared columns are touched. The runtime table is always the real one.
 */
function entityTable(entityType: EntityType) {
  return ENTITY_TABLES[entityType] as typeof exercises | undefined;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function mapExercise(row: typeof exercises.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    secondaryMuscles: row.secondaryMuscles,
    equipment: row.equipment,
    unilateral: row.unilateral,
    category: row.category,
    description: row.description,
    imageUrl: row.imageUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

function mapProgram(row: typeof programs.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    daysPerWeek: row.daysPerWeek,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt)!,
    sessions: row.sessions,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

function mapWorkoutLog(row: typeof workoutLogs.$inferSelect) {
  return {
    id: row.id,
    startedAt: toIso(row.startedAt)!,
    endedAt: toIso(row.endedAt),
    programId: row.programId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    programName: row.programName ?? undefined,
    sessionName: row.sessionName ?? undefined,
    notes: row.notes ?? undefined,
    exercises: row.exercises,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

function mapBodyMeasurement(row: typeof bodyMeasurements.$inferSelect) {
  return {
    id: row.id,
    date: toIso(row.date)!,
    weight: row.weight ?? undefined,
    bodyFat: row.bodyFat ?? undefined,
    chest: row.chest ?? undefined,
    waist: row.waist ?? undefined,
    leftArm: row.leftArm ?? undefined,
    rightArm: row.rightArm ?? undefined,
    leftThigh: row.leftThigh ?? undefined,
    rightThigh: row.rightThigh ?? undefined,
    leftCalf: row.leftCalf ?? undefined,
    rightCalf: row.rightCalf ?? undefined,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

function mapCardioSession(row: typeof cardioSessions.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    distance: row.distance,
    duration: row.duration,
    avgHeartRate: row.avgHeartRate ?? undefined,
    workoutLogId: row.workoutLogId ?? undefined,
    date: toIso(row.date)!,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

function mapPersonalRecord(row: typeof personalRecords.$inferSelect) {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseName,
    type: row.type,
    value: row.value,
    date: toIso(row.date)!,
    workoutLogId: row.workoutLogId ?? undefined,
    revision: row.revision,
    updatedAt: toIso(row.updatedAt)!,
    deletedAt: toIso(row.deletedAt),
  };
}

async function shouldApply(entityType: EntityType, entityId: string, revision: number): Promise<boolean> {
  const table = entityTable(entityType);
  if (!table) return false;
  const [row] = await db
    .select({ revision: table.revision })
    .from(table)
    .where(eq(table.id, entityId))
    .limit(1);
  if (!row) return true;
  return revision > row.revision;
}

/**
 * Insert-or-update by id. On conflict every column from `values` is updated
 * except `id` and `insertOnlyColumns` (e.g. createdAt must survive updates).
 */
async function upsertRow<TTable extends SyncTable>(
  table: TTable,
  values: TTable["$inferInsert"] & { id: string },
  insertOnlyColumns: readonly string[] = []
): Promise<void> {
  const set = Object.fromEntries(
    Object.entries(values).filter(
      ([column]) => column !== "id" && !insertOnlyColumns.includes(column)
    )
  );
  const t = table as typeof exercises;
  await db
    .insert(t)
    .values(values as unknown as typeof exercises.$inferInsert)
    .onConflictDoUpdate({
      target: t.id,
      set: set as Partial<typeof exercises.$inferInsert>,
    });
}

type ApplyResult =
  | { ok: true; applied: true }
  | { ok: true; applied: false; reason: "superseded" }
  | { ok: false; reason: string };

async function applyChange(change: SyncChange): Promise<ApplyResult> {
  if (!entityTable(change.entityType)) {
    return { ok: false, reason: "Unknown entity type" };
  }

  const canApply = await shouldApply(change.entityType, change.entityId, change.revision);
  if (!canApply) {
    return { ok: true, applied: false, reason: "superseded" };
  }

  const now = new Date();

  if (change.operation === "delete") {
    const table = entityTable(change.entityType)!;
    await db
      .update(table)
      .set({ deletedAt: now, updatedAt: now, revision: change.revision })
      .where(eq(table.id, change.entityId));
    return { ok: true, applied: true };
  }

  const payload = change.payload as Record<string, unknown>;
  if (!payload) return { ok: false, reason: "Missing payload" };

  switch (change.entityType) {
    case "exercise": {
      const p = payload as ReturnType<typeof mapExercise>;
      await upsertRow(exercises, {
        id: p.id,
        name: p.name,
        muscleGroup: p.muscleGroup,
        secondaryMuscles: p.secondaryMuscles,
        equipment: p.equipment,
        unilateral: p.unilateral,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        videoUrl: p.videoUrl,
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      });
      return { ok: true, applied: true };
    }
    case "program": {
      const p = payload as ReturnType<typeof mapProgram>;
      await upsertRow(
        programs,
        {
          id: p.id,
          name: p.name,
          description: p.description,
          daysPerWeek: p.daysPerWeek,
          isActive: p.isActive,
          createdAt: new Date(p.createdAt),
          sessions: p.sessions,
          revision: change.revision,
          updatedAt: now,
          deletedAt: null,
        },
        ["createdAt"]
      );
      return { ok: true, applied: true };
    }
    case "workoutLog": {
      const p = payload as ReturnType<typeof mapWorkoutLog>;
      await upsertRow(workoutLogs, {
        id: p.id,
        startedAt: new Date(p.startedAt),
        endedAt: p.endedAt ? new Date(p.endedAt) : null,
        programId: p.programId,
        sessionId: p.sessionId,
        programName: p.programName,
        sessionName: p.sessionName,
        notes: p.notes,
        exercises: p.exercises,
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      });
      return { ok: true, applied: true };
    }
    case "bodyMeasurement": {
      const p = payload as ReturnType<typeof mapBodyMeasurement>;
      await upsertRow(bodyMeasurements, {
        id: p.id,
        date: new Date(p.date),
        weight: p.weight,
        bodyFat: p.bodyFat,
        chest: p.chest,
        waist: p.waist,
        leftArm: p.leftArm,
        rightArm: p.rightArm,
        leftThigh: p.leftThigh,
        rightThigh: p.rightThigh,
        leftCalf: p.leftCalf,
        rightCalf: p.rightCalf,
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      });
      return { ok: true, applied: true };
    }
    case "cardioSession": {
      const p = payload as ReturnType<typeof mapCardioSession>;
      await upsertRow(cardioSessions, {
        id: p.id,
        type: p.type,
        distance: p.distance,
        duration: p.duration,
        avgHeartRate: p.avgHeartRate,
        workoutLogId: p.workoutLogId,
        date: new Date(p.date),
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      });
      return { ok: true, applied: true };
    }
    case "personalRecord": {
      const p = payload as ReturnType<typeof mapPersonalRecord>;
      await upsertRow(personalRecords, {
        id: p.id,
        exerciseId: p.exerciseId,
        exerciseName: p.exerciseName,
        type: p.type,
        value: p.value,
        date: new Date(p.date),
        workoutLogId: p.workoutLogId,
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      });
      return { ok: true, applied: true };
    }
    default:
      return { ok: false, reason: "Unknown entity type" };
  }
}

const PULL_RETRY_ATTEMPTS = 3;
const PULL_RETRY_BASE_DELAY_MS = 100;

function changedSince(
  table: { updatedAt: AnyColumn; deletedAt: AnyColumn },
  since: Date
) {
  return or(
    gt(table.updatedAt, since),
    and(isNotNull(table.deletedAt), gt(table.deletedAt, since))
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = PULL_RETRY_ATTEMPTS,
  baseDelayMs = PULL_RETRY_BASE_DELAY_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * 2 ** attempt)
        );
      }
    }
  }

  throw lastError;
}

/** Rows changed since the given moment, or all live rows on the initial pull. */
async function selectChangedRows<TTable extends SyncTable>(
  table: TTable,
  since: Date | null
): Promise<TTable["$inferSelect"][]> {
  const t = table as typeof exercises;
  const rows = await withRetry(() =>
    since
      ? db.select().from(t).where(changedSince(t, since))
      : db.select().from(t).where(isNull(t.deletedAt))
  );
  return rows as TTable["$inferSelect"][];
}

function toServerChanges<TRow extends { revision: number }>(
  entityType: EntityType,
  rows: TRow[],
  mapRow: (row: TRow) => unknown
): ServerChange[] {
  return rows.map((row) => ({
    entityType,
    entity: mapRow(row),
    revision: row.revision,
  }));
}

async function pullChanges(lastPullAt: string | null): Promise<ServerChange[]> {
  const since = lastPullAt ? new Date(lastPullAt) : null;

  const [exerciseRows, programRows, logRows, measurementRows, cardioRows, recordRows] =
    await Promise.all([
      selectChangedRows(exercises, since),
      selectChangedRows(programs, since),
      selectChangedRows(workoutLogs, since),
      selectChangedRows(bodyMeasurements, since),
      selectChangedRows(cardioSessions, since),
      selectChangedRows(personalRecords, since),
    ]);

  return [
    ...toServerChanges("exercise", exerciseRows, mapExercise),
    ...toServerChanges("program", programRows, mapProgram),
    ...toServerChanges("workoutLog", logRows, mapWorkoutLog),
    ...toServerChanges("bodyMeasurement", measurementRows, mapBodyMeasurement),
    ...toServerChanges("cardioSession", cardioRows, mapCardioSession),
    ...toServerChanges("personalRecord", recordRows, mapPersonalRecord),
  ];
}

export async function handleSync(
  lastPullAt: string | null,
  changes: SyncChange[]
): Promise<SyncResponse> {
  await ensureServerSeeded();

  const accepted: string[] = [];
  const superseded: string[] = [];
  const rejected: Array<{ id: string; reason: string }> = [];
  const appliedEntityIds = new Set<string>();

  for (const change of changes) {
    try {
      const result = await applyChange(change);
      if (result.ok && result.applied) {
        accepted.push(change.id);
        appliedEntityIds.add(change.entityId);
      } else if (result.ok && !result.applied) {
        superseded.push(change.id);
      } else {
        rejected.push({ id: change.id, reason: result.reason });
      }
    } catch (err) {
      rejected.push({
        id: change.id,
        reason: err instanceof Error ? err.message : "Apply failed",
      });
    }
  }

  const serverChanges = (await pullChanges(lastPullAt)).filter((sc) => {
    const entity = sc.entity as { id?: string; deletedAt?: string };
    if (entity.deletedAt) return true;
    return !entity.id || !appliedEntityIds.has(entity.id);
  });
  const serverTime = new Date().toISOString();

  return { accepted, superseded, rejected, serverChanges, serverTime };
}
