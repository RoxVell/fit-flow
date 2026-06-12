import { isActiveRecord, withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { ProgramEntity, WorkoutProgram, WorkoutSession } from "@/lib/db/types";
import { enqueueSync } from "@/lib/sync/queue";
import { attachExercisesToSessions, getExerciseMap } from "./exercises";

type ProgramInput = Omit<WorkoutProgram, "id" | "createdAt" | "sessions" | "revision" | "updatedAt"> & {
  sessions: {
    name: string;
    dayOfWeek: number;
    sortOrder: number;
    exercises: {
      exerciseId: string;
      targetSets: number;
      targetReps: string;
      sortOrder: number;
    }[];
  }[];
};

function buildSessions(programId: string, sessions: ProgramInput["sessions"]): WorkoutSession[] {
  return sessions.map((s) => {
    const sessionId = crypto.randomUUID();
    return {
      ...s,
      id: sessionId,
      programId,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        sessionId,
      })),
    };
  });
}

async function withAttachedExercises(program: ProgramEntity): Promise<ProgramEntity> {
  const exerciseMap = await getExerciseMap();
  return {
    ...program,
    sessions: attachExercisesToSessions(program.sessions, exerciseMap),
  };
}

export async function getPrograms(): Promise<ProgramEntity[]> {
  await ensureSeeded();
  const list = withoutDeleted(await db.programs.toArray());
  return Promise.all(list.map(withAttachedExercises));
}

export async function getActiveProgram(): Promise<ProgramEntity | undefined> {
  await ensureSeeded();
  const active = await db.programs.filter((p) => p.isActive && !p.deletedAt).first();
  return active ? withAttachedExercises(active) : undefined;
}

export async function getProgramById(id: string): Promise<ProgramEntity | undefined> {
  await ensureSeeded();
  const program = await db.programs.get(id);
  return isActiveRecord(program) ? withAttachedExercises(program) : undefined;
}

export async function createProgram(data: ProgramInput): Promise<ProgramEntity> {
  const programId = crypto.randomUUID();
  const now = new Date().toISOString();
  const entity: ProgramEntity = {
    ...data,
    id: programId,
    description: data.description || "",
    createdAt: now,
    sessions: buildSessions(programId, data.sessions),
    revision: 1,
    updatedAt: now,
  };
  await db.programs.put(entity);
  await enqueueSync({
    entityType: "program",
    entityId: entity.id,
    operation: "create",
    payload: entity,
    revision: entity.revision,
  });
  return withAttachedExercises(entity);
}

export async function updateProgram(
  id: string,
  data: ProgramInput
): Promise<ProgramEntity | undefined> {
  const existing = await db.programs.get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const entity: ProgramEntity = {
    ...data,
    id,
    description: data.description || "",
    createdAt: existing.createdAt,
    sessions: buildSessions(id, data.sessions),
    revision: existing.revision + 1,
    updatedAt: now,
  };
  await db.programs.put(entity);
  await enqueueSync({
    entityType: "program",
    entityId: entity.id,
    operation: "update",
    payload: entity,
    revision: entity.revision,
  });
  return withAttachedExercises(entity);
}

export async function deleteProgram(id: string): Promise<void> {
  const existing = await db.programs.get(id);
  if (!existing || existing.deletedAt) return;
  const now = new Date().toISOString();
  const revision = existing.revision + 1;
  await enqueueSync({
    entityType: "program",
    entityId: id,
    operation: "delete",
    revision,
  });
  await db.programs.update(id, {
    deletedAt: now,
    isActive: false,
    revision,
    updatedAt: now,
  });
}
