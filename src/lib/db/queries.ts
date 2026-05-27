import { generateId } from "../utils/calculations";
import type {
  Exercise,
  ExerciseFilters,
  WorkoutProgram,
  WorkoutLog,
  BodyMeasurement,
  PersonalRecord,
  CardioSession,
  DashboardStats,
  LoggedSet,
} from "./types";
import { getDB, seedIfEmpty } from "./idb";
import { getDashboardStatsMock } from "./seed";

let seeded = false;
async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  await seedIfEmpty();
  seeded = true;
}

function applyFilters(exercises: Exercise[], filters?: ExerciseFilters): Exercise[] {
  let result = exercises;
  if (!filters) return result;
  if (filters.muscleGroup)
    result = result.filter(
      (e) => e.muscleGroup === filters.muscleGroup || e.secondaryMuscles.includes(filters.muscleGroup!),
    );
  if (filters.equipment) result = result.filter((e) => e.equipment === filters.equipment);
  if (filters.category) result = result.filter((e) => e.category === filters.category);
  if (filters.unilateral !== undefined) result = result.filter((e) => e.unilateral === filters.unilateral);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q),
    );
  }
  return result;
}

async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll("exercises");
}

async function attachExercisesToSession(
  session: WorkoutProgram["sessions"][0],
  exercises: Exercise[],
): Promise<void> {
  for (const se of session.exercises) {
    se.exercise = exercises.find((e) => e.id === se.exerciseId);
  }
}

export async function getExercises(filters?: ExerciseFilters): Promise<Exercise[]> {
  await ensureSeeded();
  const all = await getAllExercises();
  return applyFilters(all, filters);
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  await ensureSeeded();
  const db = await getDB();
  return db.get("exercises", id);
}

export async function getPrograms(): Promise<WorkoutProgram[]> {
  await ensureSeeded();
  const db = await getDB();
  const programs = await db.getAll("programs");
  const exercises = await getAllExercises();
  for (const p of programs) {
    for (const s of p.sessions) await attachExercisesToSession(s, exercises);
  }
  return programs;
}

export async function getActiveProgram(): Promise<WorkoutProgram | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const programs = await db.getAll("programs");
  const prog = programs.find((p) => p.isActive);
  if (prog) {
    const exercises = await getAllExercises();
    for (const s of prog.sessions) await attachExercisesToSession(s, exercises);
  }
  return prog;
}

export async function getProgramById(id: string): Promise<WorkoutProgram | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const prog = await db.get("programs", id);
  if (prog) {
    const exercises = await getAllExercises();
    for (const s of prog.sessions) await attachExercisesToSession(s, exercises);
  }
  return prog;
}

export async function getWorkoutLogs(limit: number = 20): Promise<WorkoutLog[]> {
  await ensureSeeded();
  const db = await getDB();
  const all = await db.getAll("workoutLogs");
  const exercises = await getAllExercises();
  return all
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
    .map((log) => ({
      ...log,
      exercises: log.exercises.map((e) => ({
        ...e,
        exercise: exercises.find((ex) => ex.id === e.exerciseId),
      })),
    }));
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLog | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const log = await db.get("workoutLogs", id);
  if (!log) return undefined;
  const exercises = await getAllExercises();
  return {
    ...log,
    exercises: log.exercises.map((e) => ({
      ...e,
      exercise: exercises.find((ex) => ex.id === e.exerciseId),
    })),
  };
}

export async function getExerciseHistory(
  exerciseId: string,
): Promise<{ date: string; volume: number; maxWeight: number; estimated1RM: number }[]> {
  await ensureSeeded();
  const db = await getDB();
  const allLogs = await db.getAll("workoutLogs");
  const logs = allLogs
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    const volume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const maxWeight = Math.max(...completed.map((s) => s.weight));
    const bestSet = completed.reduce(
      (best, s) => {
        const e1rm = s.weight * (1 + s.reps / 30);
        return e1rm > (best?.e1rm || 0) ? { ...s, e1rm } : best;
      },
      undefined as (LoggedSet & { e1rm: number }) | undefined,
    );
    return {
      date: l.startedAt,
      volume,
      maxWeight,
      estimated1RM: bestSet?.e1rm || 0,
    };
  });
}

export async function createWorkoutLog(data: Omit<WorkoutLog, "id">): Promise<WorkoutLog> {
  await ensureSeeded();
  const db = await getDB();
  const log: WorkoutLog = { ...data, id: generateId() };
  await db.put("workoutLogs", log);
  return log;
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>,
): Promise<WorkoutLog | undefined> {
  await ensureSeeded();
  const db = await getDB();
  const existing = await db.get("workoutLogs", id);
  if (!existing) return undefined;
  const updated: WorkoutLog = { ...existing, ...data };
  await db.put("workoutLogs", updated);
  return updated;
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  await ensureSeeded();
  const db = await getDB();
  const all = await db.getAll("bodyMeasurements");
  return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  await ensureSeeded();
  const db = await getDB();
  return db.getAll("personalRecords");
}

export async function getCardioSessions(): Promise<CardioSession[]> {
  await ensureSeeded();
  const db = await getDB();
  const all = await db.getAll("cardioSessions");
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureSeeded();
  return getDashboardStatsMock();
}

export async function createCardioSession(data: Omit<CardioSession, "id">): Promise<CardioSession> {
  await ensureSeeded();
  const db = await getDB();
  const session: CardioSession = { ...data, id: generateId() };
  await db.put("cardioSessions", session);
  return session;
}

export async function logBodyMeasurement(data: Omit<BodyMeasurement, "id">): Promise<BodyMeasurement> {
  await ensureSeeded();
  const db = await getDB();
  const bm: BodyMeasurement = { ...data, id: generateId() };
  await db.put("bodyMeasurements", bm);
  return bm;
}
