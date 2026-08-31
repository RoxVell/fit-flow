import { isActiveRecord, withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { ProgramEntity, WorkoutProgram, WorkoutSession } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";
import { putEntityWithSync, softDeleteEntity } from "./entity-crud";
import { attachExercises, getExerciseMap } from "./exercises";

type ProgramInput = Omit<
  WorkoutProgram,
  "id" | "createdAt" | "sessions" | "revision" | "updatedAt" | "isActive"
> & {
  isActive?: boolean;
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
    const sessionId = generateId();
    return {
      ...s,
      id: sessionId,
      programId,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: generateId(),
        sessionId,
      })),
    };
  });
}

async function withAttachedExercises(program: ProgramEntity): Promise<ProgramEntity> {
  const exerciseMap = await getExerciseMap();
  return {
    ...program,
    sessions: attachExercises(program.sessions, exerciseMap),
  };
}

export async function getProgramById(id: string): Promise<ProgramEntity | undefined> {
  await ensureSeeded();
  const program = await db.programs.get(id);
  return isActiveRecord(program) ? withAttachedExercises(program) : undefined;
}

export async function createProgram(data: ProgramInput): Promise<ProgramEntity> {
  const programId = generateId();
  const now = new Date().toISOString();
  const hasActiveProgram =
    (await db.programs.filter((p) => p.isActive && !p.deletedAt).count()) > 0;
  const entity: ProgramEntity = {
    ...data,
    id: programId,
    description: data.description || "",
    isActive: data.isActive ?? !hasActiveProgram,
    createdAt: now,
    sessions: buildSessions(programId, data.sessions),
    revision: 1,
    updatedAt: now,
  };
  await putEntityWithSync(db.programs, "program", entity, "create");
  return withAttachedExercises(entity);
}

export async function updateProgram(
  id: string,
  data: ProgramInput
): Promise<ProgramEntity | undefined> {
  const existing = await db.programs.get(id);
  if (!existing || existing.deletedAt) return undefined;
  const entity: ProgramEntity = {
    ...data,
    id,
    description: data.description || "",
    isActive: existing.isActive,
    createdAt: existing.createdAt,
    sessions: buildSessions(id, data.sessions),
    revision: existing.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  await putEntityWithSync(db.programs, "program", entity, "update");
  return withAttachedExercises(entity);
}

export async function setActiveProgram(id: string): Promise<ProgramEntity | undefined> {
  const target = await db.programs.get(id);
  if (!isActiveRecord(target)) return undefined;

  const programs = withoutDeleted(await db.programs.toArray());
  const now = new Date().toISOString();

  for (const program of programs) {
    const shouldBeActive = program.id === id;
    if (program.isActive === shouldBeActive) continue;

    await putEntityWithSync(
      db.programs,
      "program",
      {
        ...program,
        isActive: shouldBeActive,
        revision: program.revision + 1,
        updatedAt: now,
      },
      "update"
    );
  }

  return getProgramById(id);
}

export async function deleteProgram(id: string): Promise<void> {
  await softDeleteEntity(db.programs, "program", id, { isActive: false });
}
