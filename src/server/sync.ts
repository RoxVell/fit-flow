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
    weight: row.weight,
    bodyFat: row.bodyFat ?? undefined,
    chest: row.chest ?? undefined,
    waist: row.waist ?? undefined,
    arms: row.arms ?? undefined,
    thighs: row.thighs ?? undefined,
    calves: row.calves ?? undefined,
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
  const tables = {
    exercise: exercises,
    program: programs,
    workoutLog: workoutLogs,
    bodyMeasurement: bodyMeasurements,
    cardioSession: cardioSessions,
    personalRecord: personalRecords,
  } as const;
  const table = tables[entityType];
  const [row] = await db.select({ revision: table.revision }).from(table).where(eq(table.id, entityId)).limit(1);
  if (!row) return true;
  return revision > row.revision;
}

type ApplyResult =
  | { ok: true; applied: true }
  | { ok: true; applied: false; reason: "superseded" }
  | { ok: false; reason: string };

async function applyChange(change: SyncChange): Promise<ApplyResult> {
  const canApply = await shouldApply(change.entityType, change.entityId, change.revision);
  if (!canApply) {
    return { ok: true, applied: false, reason: "superseded" };
  }

  const now = new Date();

  if (change.operation === "delete") {
    const patch = { deletedAt: now, updatedAt: now, revision: change.revision };
    switch (change.entityType) {
      case "exercise":
        await db.update(exercises).set(patch).where(eq(exercises.id, change.entityId));
        break;
      case "program":
        await db.update(programs).set(patch).where(eq(programs.id, change.entityId));
        break;
      case "workoutLog":
        await db.update(workoutLogs).set(patch).where(eq(workoutLogs.id, change.entityId));
        break;
      case "bodyMeasurement":
        await db.update(bodyMeasurements).set(patch).where(eq(bodyMeasurements.id, change.entityId));
        break;
      case "cardioSession":
        await db.update(cardioSessions).set(patch).where(eq(cardioSessions.id, change.entityId));
        break;
      case "personalRecord":
        await db.update(personalRecords).set(patch).where(eq(personalRecords.id, change.entityId));
        break;
      default:
        return { ok: false, reason: "Unknown entity type" };
    }
    return { ok: true, applied: true };
  }

  const payload = change.payload as Record<string, unknown>;
  if (!payload) return { ok: false, reason: "Missing payload" };

  switch (change.entityType) {
    case "exercise": {
      const p = payload as ReturnType<typeof mapExercise>;
      const values = {
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
      };
      await db.insert(exercises).values(values).onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: values.name,
          muscleGroup: values.muscleGroup,
          secondaryMuscles: values.secondaryMuscles,
          equipment: values.equipment,
          unilateral: values.unilateral,
          category: values.category,
          description: values.description,
          imageUrl: values.imageUrl,
          videoUrl: values.videoUrl,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
      });
      return { ok: true, applied: true };
    }
    case "program": {
      const p = payload as ReturnType<typeof mapProgram>;
      const values = {
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
      };
      await db.insert(programs).values(values).onConflictDoUpdate({
        target: programs.id,
        set: {
          name: values.name,
          description: values.description,
          daysPerWeek: values.daysPerWeek,
          isActive: values.isActive,
          sessions: values.sessions,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
      });
      return { ok: true, applied: true };
    }
    case "workoutLog": {
      const p = payload as ReturnType<typeof mapWorkoutLog>;
      const values = {
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
      };
      await db.insert(workoutLogs).values(values).onConflictDoUpdate({
        target: workoutLogs.id,
        set: {
          startedAt: values.startedAt,
          endedAt: values.endedAt,
          programId: values.programId,
          sessionId: values.sessionId,
          programName: values.programName,
          sessionName: values.sessionName,
          notes: values.notes,
          exercises: values.exercises,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
      });
      return { ok: true, applied: true };
    }
    case "bodyMeasurement": {
      const p = payload as ReturnType<typeof mapBodyMeasurement>;
      const values = {
        id: p.id,
        date: new Date(p.date),
        weight: p.weight,
        bodyFat: p.bodyFat,
        chest: p.chest,
        waist: p.waist,
        arms: p.arms,
        thighs: p.thighs,
        calves: p.calves,
        revision: change.revision,
        updatedAt: now,
        deletedAt: null,
      };
      await db.insert(bodyMeasurements).values(values).onConflictDoUpdate({
        target: bodyMeasurements.id,
        set: {
          date: values.date,
          weight: values.weight,
          bodyFat: values.bodyFat,
          chest: values.chest,
          waist: values.waist,
          arms: values.arms,
          thighs: values.thighs,
          calves: values.calves,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
      });
      return { ok: true, applied: true };
    }
    case "cardioSession": {
      const p = payload as ReturnType<typeof mapCardioSession>;
      const values = {
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
      };
      await db.insert(cardioSessions).values(values).onConflictDoUpdate({
        target: cardioSessions.id,
        set: {
          type: values.type,
          distance: values.distance,
          duration: values.duration,
          avgHeartRate: values.avgHeartRate,
          workoutLogId: values.workoutLogId,
          date: values.date,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
      });
      return { ok: true, applied: true };
    }
    case "personalRecord": {
      const p = payload as ReturnType<typeof mapPersonalRecord>;
      const values = {
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
      };
      await db.insert(personalRecords).values(values).onConflictDoUpdate({
        target: personalRecords.id,
        set: {
          exerciseId: values.exerciseId,
          exerciseName: values.exerciseName,
          type: values.type,
          value: values.value,
          date: values.date,
          workoutLogId: values.workoutLogId,
          revision: values.revision,
          updatedAt: values.updatedAt,
          deletedAt: null,
        },
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

async function pullChanges(lastPullAt: string | null): Promise<ServerChange[]> {
  const since = lastPullAt ? new Date(lastPullAt) : null;

  const [
    exerciseRows,
    programRows,
    logRows,
    measurementRows,
    cardioRows,
    recordRows,
  ] = await Promise.all([
    withRetry(() =>
      since
        ? db.select().from(exercises).where(changedSince(exercises, since))
        : db.select().from(exercises).where(isNull(exercises.deletedAt))
    ),
    withRetry(() =>
      since
        ? db.select().from(programs).where(changedSince(programs, since))
        : db.select().from(programs).where(isNull(programs.deletedAt))
    ),
    withRetry(() =>
      since
        ? db.select().from(workoutLogs).where(changedSince(workoutLogs, since))
        : db.select().from(workoutLogs).where(isNull(workoutLogs.deletedAt))
    ),
    withRetry(() =>
      since
        ? db
            .select()
            .from(bodyMeasurements)
            .where(changedSince(bodyMeasurements, since))
        : db
            .select()
            .from(bodyMeasurements)
            .where(isNull(bodyMeasurements.deletedAt))
    ),
    withRetry(() =>
      since
        ? db
            .select()
            .from(cardioSessions)
            .where(changedSince(cardioSessions, since))
        : db
            .select()
            .from(cardioSessions)
            .where(isNull(cardioSessions.deletedAt))
    ),
    withRetry(() =>
      since
        ? db
            .select()
            .from(personalRecords)
            .where(changedSince(personalRecords, since))
        : db
            .select()
            .from(personalRecords)
            .where(isNull(personalRecords.deletedAt))
    ),
  ]);

  return [
    ...exerciseRows.map((r) => ({
      entityType: "exercise" as EntityType,
      entity: mapExercise(r),
      revision: r.revision,
    })),
    ...programRows.map((r) => ({
      entityType: "program" as EntityType,
      entity: mapProgram(r),
      revision: r.revision,
    })),
    ...logRows.map((r) => ({
      entityType: "workoutLog" as EntityType,
      entity: mapWorkoutLog(r),
      revision: r.revision,
    })),
    ...measurementRows.map((r) => ({
      entityType: "bodyMeasurement" as EntityType,
      entity: mapBodyMeasurement(r),
      revision: r.revision,
    })),
    ...cardioRows.map((r) => ({
      entityType: "cardioSession" as EntityType,
      entity: mapCardioSession(r),
      revision: r.revision,
    })),
    ...recordRows.map((r) => ({
      entityType: "personalRecord" as EntityType,
      entity: mapPersonalRecord(r),
      revision: r.revision,
    })),
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
