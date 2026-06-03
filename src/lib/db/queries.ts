import { generateId } from "../utils/calculations";
import { bestE1RM, bestWeight, volume } from "../training-metrics";
import { ensureSeeded } from "./seed-loader";
import {
  idbBulkPut,
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
} from "./idb";
import type {
  BodyMeasurement,
  CardioSession,
  DashboardStats,
  Exercise,
  ExerciseFilters,
  LoggedExercise,
  PersonalRecord,
  WorkoutLog,
  WorkoutProgram,
  WorkoutSession,
} from "./types";

function filterExercises(
  exercises: Exercise[],
  filters?: ExerciseFilters
): Exercise[] {
  let result = [...exercises];
  if (!filters) return result;
  if (filters.muscleGroup) {
    result = result.filter(
      (e) =>
        e.muscleGroup === filters.muscleGroup ||
        e.secondaryMuscles.includes(filters.muscleGroup!)
    );
  }
  if (filters.equipment) {
    result = result.filter((e) => e.equipment === filters.equipment);
  }
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.unilateral !== undefined) {
    result = result.filter((e) => e.unilateral === filters.unilateral);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q)
    );
  }
  return result;
}

function attachExercises(
  sessions: WorkoutSession[],
  exerciseMap: Map<string, Exercise>
): void {
  for (const session of sessions) {
    for (const se of session.exercises) {
      se.exercise = exerciseMap.get(se.exerciseId);
    }
  }
}

function attachExercisesToLogs(
  logs: WorkoutLog[],
  exerciseMap: Map<string, Exercise>
): WorkoutLog[] {
  return logs.map((log) => ({
    ...log,
    exercises: log.exercises.map((e) => ({
      ...e,
      exercise: exerciseMap.get(e.exerciseId),
    })),
  }));
}

async function getExerciseMap(): Promise<Map<string, Exercise>> {
  const all = await idbGetAll("exercises");
  return new Map(all.map((e) => [e.id, e]));
}

export async function getExercises(
  filters?: ExerciseFilters
): Promise<Exercise[]> {
  await ensureSeeded();
  const all = await idbGetAll("exercises");
  return filterExercises(all, filters);
}

export async function getExerciseById(
  id: string
): Promise<Exercise | undefined> {
  await ensureSeeded();
  return idbGet("exercises", id);
}

export async function getPrograms(): Promise<WorkoutProgram[]> {
  await ensureSeeded();
  const [list, exerciseMap] = await Promise.all([
    idbGetAll("programs"),
    getExerciseMap(),
  ]);
  for (const p of list) attachExercises(p.sessions, exerciseMap);
  return list;
}

export async function getActiveProgram(): Promise<WorkoutProgram | undefined> {
  await ensureSeeded();
  const [list, exerciseMap] = await Promise.all([
    idbGetAll("programs"),
    getExerciseMap(),
  ]);
  const active = list.find((p) => p.isActive);
  if (active) attachExercises(active.sessions, exerciseMap);
  return active;
}

export async function getProgramById(
  id: string
): Promise<WorkoutProgram | undefined> {
  await ensureSeeded();
  const [program, exerciseMap] = await Promise.all([
    idbGet("programs", id),
    getExerciseMap(),
  ]);
  if (program) attachExercises(program.sessions, exerciseMap);
  return program;
}

export async function getWorkoutLogs(limit: number = 20): Promise<WorkoutLog[]> {
  await ensureSeeded();
  const [all, exerciseMap] = await Promise.all([
    idbGetAll("workoutLogs"),
    getExerciseMap(),
  ]);
  return attachExercisesToLogs(
    all
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
      .slice(0, limit),
    exerciseMap
  );
}

export async function getWorkoutLogById(
  id: string
): Promise<WorkoutLog | undefined> {
  await ensureSeeded();
  const [log, exerciseMap] = await Promise.all([
    idbGet("workoutLogs", id),
    getExerciseMap(),
  ]);
  if (!log) return undefined;
  return attachExercisesToLogs([log], exerciseMap)[0];
}

export async function getExerciseHistory(
  exerciseId: string
): Promise<{ date: string; volume: number; maxWeight: number; estimated1RM: number }[]> {
  await ensureSeeded();
  const all = await idbGetAll("workoutLogs");
  const logs = all
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    return {
      date: l.startedAt,
      volume: volume(completed),
      maxWeight: bestWeight(completed),
      estimated1RM: bestE1RM(completed),
    };
  });
}

export async function getExerciseDetailedHistory(
  exerciseId: string
): Promise<{ date: string; bestE1RM: number; sets: { weight: number; reps: number; type: string; setOrder: number }[] }[]> {
  await ensureSeeded();
  const all = await idbGetAll("workoutLogs");
  const logs = all
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

  return logs.map((l) => {
    const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
    const completed = ex.sets.filter((s) => s.completed);
    return {
      date: l.startedAt,
      bestE1RM: bestE1RM(completed),
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
  const log: WorkoutLog = { ...data, id: generateId() };
  await idbPut("workoutLogs", log);
  return log;
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>
): Promise<WorkoutLog | undefined> {
  const existing = await idbGet("workoutLogs", id);
  if (!existing) return undefined;
  const updated: WorkoutLog = { ...existing, ...data, id };
  await idbPut("workoutLogs", updated);
  return updated;
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  await ensureSeeded();
  const all = await idbGetAll("bodyMeasurements");
  return all.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  await ensureSeeded();
  return idbGetAll("personalRecords");
}

export async function getCardioSessions(): Promise<CardioSession[]> {
  await ensureSeeded();
  const all = await idbGetAll("cardioSessions");
  return all.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureSeeded();
  const [logs, measurements, programs, exerciseMap] = await Promise.all([
    idbGetAll("workoutLogs"),
    idbGetAll("bodyMeasurements"),
    idbGetAll("programs"),
    getExerciseMap(),
  ]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = logs.filter(
    (l) => new Date(l.startedAt) >= weekAgo
  );

  const weeklyVolume = thisWeek.reduce(
    (sum, l) =>
      sum + l.exercises.reduce((es, e) => es + volume(e.sets), 0),
    0
  );

  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const lastTwo = sortedMeasurements.slice(-2);
  const currentWeight = lastTwo[lastTwo.length - 1]?.weight ?? 0;
  const prevWeight = lastTwo[0]?.weight;
  const weightTrend: DashboardStats["weightTrend"] =
    prevWeight === undefined
      ? "stable"
      : currentWeight > prevWeight
        ? "up"
        : currentWeight < prevWeight
          ? "down"
          : "stable";

  const activeProgram = programs.find((p) => p.isActive);
  const today = new Date().getDay();
  const nextSession =
    activeProgram?.sessions.find((s) => s.dayOfWeek === today) ??
    activeProgram?.sessions[0];

  const heatmapData: DashboardStats["heatmapData"] = {
    chest: 0,
    back: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    forearms: 0,
    quads: 0,
    hamstrings: 0,
    glutes: 0,
    calves: 0,
    abs: 0,
    traps: 0,
    hip_flexors: 0,
    full_body: 0,
  };
  for (const log of thisWeek) {
    for (const ex of log.exercises) {
      const ref = exerciseMap.get(ex.exerciseId);
      if (!ref) continue;
      const completed = ex.sets.filter((s) => s.completed).length;
      if (completed > 0) {
        heatmapData[ref.muscleGroup] += completed;
        for (const sec of ref.secondaryMuscles) {
          heatmapData[sec] += completed;
        }
      }
    }
  }

  const activeDays = new Set(
    thisWeek.map((l) => new Date(l.startedAt).toDateString())
  ).size;

  return {
    weeklyWorkouts: thisWeek.length,
    weeklyVolume,
    currentWeight,
    weightTrend,
    steps: 8432,
    calories: 345,
    activeDays,
    nextSession,
    heatmapData,
  };
}

export async function createProgram(
  data: Omit<WorkoutProgram, "id" | "createdAt" | "sessions"> & {
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
  }
): Promise<WorkoutProgram> {
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
        exercise: undefined,
      })),
    })),
  };
  for (const session of program.sessions) {
    for (const se of session.exercises) {
      se.sessionId = session.id;
    }
  }
  const exerciseMap = await getExerciseMap();
  attachExercises(program.sessions, exerciseMap);
  await idbPut("programs", program);
  return program;
}

export async function updateProgram(
  id: string,
  data: Omit<WorkoutProgram, "id" | "createdAt" | "sessions"> & {
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
  }
): Promise<WorkoutProgram | undefined> {
  const existing = await idbGet("programs", id);
  if (!existing) return undefined;

  const updated: WorkoutProgram = {
    ...data,
    id,
    description: data.description || "",
    createdAt: existing.createdAt,
    sessions: data.sessions.map((s) => ({
      ...s,
      id: generateId(),
      programId: id,
      exercises: s.exercises.map((e) => ({
        ...e,
        id: generateId(),
        sessionId: "",
        exercise: undefined,
      })),
    })),
  };
  for (const session of updated.sessions) {
    for (const se of session.exercises) {
      se.sessionId = session.id;
    }
  }
  const exerciseMap = await getExerciseMap();
  attachExercises(updated.sessions, exerciseMap);
  await idbPut("programs", updated);
  return updated;
}

export async function createCardioSession(
  data: Omit<CardioSession, "id">
): Promise<CardioSession> {
  const session: CardioSession = { ...data, id: generateId() };
  await idbPut("cardioSessions", session);
  return session;
}

export async function logBodyMeasurement(
  data: Omit<BodyMeasurement, "id">
): Promise<BodyMeasurement> {
  const bm: BodyMeasurement = { ...data, id: generateId() };
  await idbPut("bodyMeasurements", bm);
  return bm;
}

export async function createPersonalRecord(
  data: Omit<PersonalRecord, "id">
): Promise<PersonalRecord> {
  const pr: PersonalRecord = { ...data, id: generateId() };
  await idbPut("personalRecords", pr);
  return pr;
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  await idbDelete("workoutLogs", id);
}

export async function deleteCardioSession(id: string): Promise<void> {
  await idbDelete("cardioSessions", id);
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  await idbDelete("bodyMeasurements", id);
}

export async function deletePersonalRecord(id: string): Promise<void> {
  await idbDelete("personalRecords", id);
}

export async function seedIfEmpty(): Promise<void> {
  await ensureSeeded();
}

export { idbBulkPut };
