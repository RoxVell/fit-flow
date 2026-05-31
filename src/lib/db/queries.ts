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
  workoutLogs,
  bodyMeasurements,
  personalRecords,
  cardioSessions,
  getDashboardStatsMock,
} from "./seed";

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

function attachExercisesToSession(session: WorkoutProgram["sessions"][0]): void {
  for (const se of session.exercises) {
    se.exercise = exercises.find((e) => e.id === se.exerciseId);
  }
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
  for (const p of programs) for (const s of p.sessions) attachExercisesToSession(s);
  return programs;
}

export async function getActiveProgram(): Promise<WorkoutProgram | undefined> {
  await delay(300);
  const prog = programs.find((p) => p.isActive);
  if (prog) for (const s of prog.sessions) attachExercisesToSession(s);
  return prog;
}

export async function getProgramById(id: string): Promise<WorkoutProgram | undefined> {
  await delay(300);
  const prog = programs.find((p) => p.id === id);
  if (prog) for (const s of prog.sessions) attachExercisesToSession(s);
  return prog;
}

export async function getWorkoutLogs(limit: number = 20): Promise<WorkoutLog[]> {
  await delay(400);
  return workoutLogs
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
  await delay(300);
  const log = workoutLogs.find((l) => l.id === id);
  if (!log) return undefined;
  return {
    ...log,
    exercises: log.exercises.map((e) => ({
      ...e,
      exercise: exercises.find((ex) => ex.id === e.exerciseId),
    })),
  };
}

export async function getExerciseHistory(
  exerciseId: string
): Promise<{ date: string; volume: number; maxWeight: number; estimated1RM: number }[]> {
  await delay(300);
  const logs = workoutLogs
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

export async function getExerciseDetailedHistory(
  exerciseId: string
): Promise<{ date: string; bestE1RM: number; sets: { weight: number; reps: number; type: string; setOrder: number }[] }[]> {
  await delay(300);
  const logs = workoutLogs
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    const bestE1RM = completed.reduce((best, s) => {
      const e1rm = s.weight * (1 + s.reps / 30);
      return e1rm > (best?.e1rm || 0) ? { ...s, e1rm } : best;
    }, undefined as (LoggedSet & { e1rm: number }) | undefined);
    return {
      date: l.startedAt,
      bestE1RM: bestE1RM?.e1rm || 0,
      sets: completed.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        type: s.type,
        setOrder: s.setOrder,
      })),
    };
  });
}

export async function createWorkoutLog(
  data: Omit<WorkoutLog, "id">
): Promise<WorkoutLog> {
  await delay(500);
  const log: WorkoutLog = { ...data, id: generateId() };
  workoutLogs.unshift(log);
  return log;
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>
): Promise<WorkoutLog | undefined> {
  await delay(400);
  const idx = workoutLogs.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  workoutLogs[idx] = { ...workoutLogs[idx], ...data };
  return workoutLogs[idx];
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  await delay(300);
  return [...bodyMeasurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  await delay(300);
  return personalRecords;
}

export async function getCardioSessions(): Promise<CardioSession[]> {
  await delay(300);
  return [...cardioSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);
  return getDashboardStatsMock();
}

export async function createProgram(
  data: Omit<WorkoutProgram, "id" | "createdAt" | "sessions"> & {
    sessions: { name: string; dayOfWeek: number; sortOrder: number; exercises: { exerciseId: string; targetSets: number; targetReps: string; sortOrder: number }[] }[];
  }
): Promise<WorkoutProgram> {
  await delay(500);
  const programId = generateId();
  const program: WorkoutProgram = {
    ...data,
    id: programId,
    description: data.description || "",
    createdAt: new Date().toISOString(),
    sessions: data.sessions.map((s) => ({
      ...s,
      id: generateId(),
      programId,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: generateId(),
        sessionId: "",
        exercise: exercises.find((ex) => ex.id === e.exerciseId),
      })),
    })),
  };
  // Set sessionId on each exercise
  for (const session of program.sessions) {
    for (const se of session.exercises) {
      se.sessionId = session.id;
    }
  }
  programs.push(program);
  return program;
}

export async function updateProgram(
  id: string,
  data: Omit<WorkoutProgram, "id" | "createdAt" | "sessions"> & {
    sessions: { name: string; dayOfWeek: number; sortOrder: number; exercises: { exerciseId: string; targetSets: number; targetReps: string; sortOrder: number }[] }[];
  }
): Promise<WorkoutProgram | undefined> {
  await delay(500);
  const idx = programs.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated: WorkoutProgram = {
    ...data,
    id,
    description: data.description || "",
    createdAt: programs[idx].createdAt,
    sessions: data.sessions.map((s) => ({
      ...s,
      id: generateId(),
      programId: id,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: generateId(),
        sessionId: "",
        exercise: exercises.find((ex) => ex.id === e.exerciseId),
      })),
    })),
  };
  for (const session of updated.sessions) {
    for (const se of session.exercises) {
      se.sessionId = session.id;
    }
  }
  programs[idx] = updated;
  return updated;
}

export async function createCardioSession(
  data: Omit<CardioSession, "id">
): Promise<CardioSession> {
  await delay(400);
  const session: CardioSession = { ...data, id: generateId() };
  cardioSessions.unshift(session);
  return session;
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id">
): Promise<BodyMeasurement> {
  await delay(300);
  const bm: BodyMeasurement = { ...data, id: generateId() };
  bodyMeasurements.push(bm);
  return bm;
}
