import { delay, generateId } from "../utils/calculations";
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
import {
  exercises,
  programs,
  workoutLogs as seedLogs,
  bodyMeasurements as seedMeasurements,
  personalRecords,
  cardioSessions as seedCardio,
  getDashboardStatsMock,
} from "./seed";
import { localDb } from "./local-db";

function filterExercises(filters?: ExerciseFilters): Exercise[] {
  let result = [...exercises];
  if (!filters) return result;
  if (filters.muscleGroup)
    result = result.filter(
      (e) => e.muscleGroup === filters.muscleGroup || e.secondaryMuscles.includes(filters.muscleGroup!)
    );
  if (filters.equipment) result = result.filter((e) => e.equipment === filters.equipment);
  if (filters.category) result = result.filter((e) => e.category === filters.category);
  if (filters.unilateral !== undefined) result = result.filter((e) => e.unilateral === filters.unilateral);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
  }
  return result;
}

function attachExercises(log: WorkoutLog): WorkoutLog {
  return {
    ...log,
    exercises: log.exercises.map((e) => ({
      ...e,
      exercise: exercises.find((ex) => ex.id === e.exerciseId),
    })),
  };
}

export async function getExercises(filters?: ExerciseFilters): Promise<Exercise[]> {
  await delay(300);
  return filterExercises(filters);
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  await delay(200);
  return exercises.find((e) => e.id === id);
}

export async function getPrograms(): Promise<WorkoutProgram[]> {
  await delay(400);
  for (const p of programs) for (const s of p.sessions) {
    for (const se of s.exercises) {
      se.exercise = exercises.find((e) => e.id === se.exerciseId);
    }
  }
  return programs;
}

export async function getActiveProgram(): Promise<WorkoutProgram | undefined> {
  await delay(300);
  const prog = programs.find((p) => p.isActive);
  if (prog) for (const s of prog.sessions) {
    for (const se of s.exercises) {
      se.exercise = exercises.find((e) => e.id === se.exerciseId);
    }
  }
  return prog;
}

export async function getProgramById(id: string): Promise<WorkoutProgram | undefined> {
  await delay(300);
  const prog = programs.find((p) => p.id === id);
  if (prog) for (const s of prog.sessions) {
    for (const se of s.exercises) {
      se.exercise = exercises.find((e) => e.id === se.exerciseId);
    }
  }
  return prog;
}

export async function getWorkoutLogs(limit: number = 20): Promise<WorkoutLog[]> {
  await delay(400);
  const persisted = await localDb.workoutLogs.getAll();
  const all = [...seedLogs, ...persisted];
  return all
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
    .map(attachExercises);
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLog | undefined> {
  await delay(300);
  const fromSeed = seedLogs.find((l) => l.id === id);
  if (fromSeed) return attachExercises(fromSeed);
  const persisted = await localDb.workoutLogs.getAll();
  const fromDb = persisted.find((l) => l.id === id);
  if (!fromDb) return undefined;
  return attachExercises(fromDb);
}

export async function getExerciseHistory(
  exerciseId: string
): Promise<{ date: string; volume: number; maxWeight: number; estimated1RM: number }[]> {
  await delay(300);
  const persisted = await localDb.workoutLogs.getAll();
  const all = [...seedLogs, ...persisted];
  const logs = all
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    const volume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const maxWeight = Math.max(...completed.map((s) => s.weight));
    const bestSet = completed.reduce((best, s) => {
      const e1rm = s.weight * (1 + s.reps / 30);
      return e1rm > (best?.e1rm || 0) ? { ...s, e1rm } : best;
    }, undefined as (LoggedSet & { e1rm: number }) | undefined);
    return {
      date: l.startedAt,
      volume,
      maxWeight,
      estimated1RM: bestSet?.e1rm || 0,
    };
  });
}

export async function createWorkoutLog(
  data: Omit<WorkoutLog, "id">
): Promise<WorkoutLog> {
  await delay(200);
  const log: WorkoutLog = { ...data, id: generateId() };
  await localDb.workoutLogs.add(log);
  return log;
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>
): Promise<WorkoutLog | undefined> {
  await delay(200);
  const persisted = await localDb.workoutLogs.getAll();
  const existing = persisted.find((l) => l.id === id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  await localDb.workoutLogs.delete(id);
  await localDb.workoutLogs.add(updated);
  return updated;
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  await delay(300);
  const persisted = await localDb.bodyMeasurements.getAll();
  const all = [...seedMeasurements, ...persisted];
  return all.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  await delay(300);
  return personalRecords;
}

export async function getCardioSessions(): Promise<CardioSession[]> {
  await delay(300);
  const persisted = await localDb.cardioSessions.getAll();
  const all = [...seedCardio, ...persisted];
  return all.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);
  return getDashboardStatsMock();
}

export async function createCardioSession(
  data: Omit<CardioSession, "id">
): Promise<CardioSession> {
  await delay(200);
  const session: CardioSession = { ...data, id: generateId() };
  await localDb.cardioSessions.add(session);
  return session;
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id">
): Promise<BodyMeasurement> {
  await delay(200);
  const bm: BodyMeasurement = { ...data, id: generateId() };
  await localDb.bodyMeasurements.add(bm);
  return bm;
}
