import { isActiveRecord } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type { ProgramEntity, SessionExercise, WorkoutProgram, WorkoutSession } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";
import { putEntityWithSync, softDeleteEntity, updateEntity } from "./entity-crud";
import { attachExercises, getExerciseMap } from "./exercises";

type ExerciseInput = Omit<SessionExercise, "id" | "sessionId"> & { id?: string };
type SessionInput = Omit<WorkoutSession, "id" | "programId" | "exercises"> & {
  id?: string;
  exercises: ExerciseInput[];
};

export type ProgramInput = Omit<
  WorkoutProgram,
  "id" | "createdAt" | "sessions" | "isActive"
> & {
  isActive?: boolean;
  sessions: SessionInput[];
};

function buildSessions(programId: string, sessions: ProgramInput["sessions"]): WorkoutSession[] {
  return sessions.map((s) => {
    const sessionId = s.id ?? generateId();
    return {
      ...s,
      id: sessionId,
      programId,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: e.id ?? generateId(),
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

function activePrograms() {
  return db.programs.filter((program) => program.isActive && !program.deletedAt);
}

async function deactivateOtherPrograms(keepId?: string) {
  for (const program of await activePrograms().toArray()) {
    if (program.id !== keepId) {
      await updateEntity(db.programs, "program", program.id, { isActive: false });
    }
  }
}

export async function createProgram(data: ProgramInput): Promise<ProgramEntity> {
  const program = await db.transaction("rw", db.programs, db.syncQueue, async () => {
    const isActive = data.isActive ?? !(await activePrograms().first());
    if (data.isActive) await deactivateOtherPrograms();
    const id = generateId();
    const now = new Date().toISOString();
    return putEntityWithSync(db.programs, "program", {
      ...data,
      id,
      description: data.description || "",
      isActive,
      createdAt: now,
      sessions: buildSessions(id, data.sessions),
      revision: 1,
      updatedAt: now,
    }, "create");
  });
  return withAttachedExercises(program);
}

export async function updateProgram(
  id: string,
  { sessions, name, description, daysPerWeek, restDurationSeconds }: ProgramInput
): Promise<ProgramEntity | undefined> {
  const program = await updateEntity(db.programs, "program", id, {
    name, description: description || "", daysPerWeek, restDurationSeconds,
    sessions: buildSessions(id, sessions),
  });
  return program && withAttachedExercises(program);
}

export async function setActiveProgram(id: string): Promise<ProgramEntity | undefined> {
  const program = await db.transaction("rw", db.programs, db.syncQueue, async () => {
    const target = await db.programs.get(id);
    if (!isActiveRecord(target)) return undefined;
    await deactivateOtherPrograms(id);
    return target.isActive ? target : updateEntity(db.programs, "program", id, { isActive: true });
  });
  return program && withAttachedExercises(program);
}

export async function deleteProgram(id: string): Promise<void> {
  await softDeleteEntity(db.programs, "program", id, { isActive: false });
}

/** Update future session templates without rebuilding IDs or touching workout logs. */
export async function replaceExerciseInProgram(
  programId: string,
  fromExerciseId: string,
  toExerciseId: string
): Promise<void> {
  if (fromExerciseId === toExerciseId) return;
  await db.transaction("rw", db.programs, db.syncQueue, async () => {
    const program = await db.programs.get(programId);
    if (!isActiveRecord(program)) throw new Error("Program no longer available");
    if (!program.sessions.some((s) => s.exercises.some((e) => e.exerciseId === fromExerciseId))) return;
    await putEntityWithSync(db.programs, "program", {
      ...program,
      sessions: program.sessions.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise) =>
          exercise.exerciseId === fromExerciseId
            ? { ...exercise, exerciseId: toExerciseId, exercise: undefined }
            : exercise
        ),
      })),
      revision: program.revision + 1,
      updatedAt: new Date().toISOString(),
    }, "update");
  });
}
