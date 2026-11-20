// Per-exercise history for the Exercises view: port of the web app's
// src/lib/workout/exercise-stats.ts and src/lib/hooks/use-exercise-usage.ts.
import type { LoggedExercise, WorkoutLog, WorkoutLogEntity } from "@/lib/db/types";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";

export type ExerciseHistoryPoint = {
  date: string;
  volume: number;
  maxWeight: number;
  estimated1RM: number;
};

export type ExerciseHistorySet = {
  weight: number;
  reps: number;
  type: string;
  setOrder: number;
};

export type ExerciseHistorySession = {
  date: string;
  bestE1RM: number;
  excludeFromStats: boolean;
  notes?: string;
  sets: ExerciseHistorySet[];
};

function findLoggedExercise(exercises: LoggedExercise[], exerciseId: string): LoggedExercise | undefined {
  return exercises.find((exercise) => exercise.exerciseId === exerciseId);
}

export function toExerciseHistoryPoint(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string,
): ExerciseHistoryPoint | null {
  const exercise = findLoggedExercise(log.exercises, exerciseId);
  if (!exercise || exercise.excludeFromStats) return null;
  const completed = exercise.sets.filter((set) => set.completed);
  return {
    date: log.startedAt,
    volume: volume(completed),
    maxWeight: bestWeight(completed),
    estimated1RM: bestE1RM(completed),
  };
}

export function toExerciseHistorySession(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string,
): ExerciseHistorySession | null {
  const exercise = findLoggedExercise(log.exercises, exerciseId);
  if (!exercise) return null;
  const completed = exercise.sets.filter((set) => set.completed);
  const notes = exercise.notes?.trim();
  return {
    date: log.startedAt,
    bestE1RM: bestE1RM(completed),
    excludeFromStats: Boolean(exercise.excludeFromStats),
    notes: notes || undefined,
    sets: completed
      .map((set) => ({ weight: set.weight, reps: set.reps, type: set.type, setOrder: set.setOrder }))
      .sort((a, b) => a.setOrder - b.setOrder),
  };
}

const time = (iso: string) => new Date(iso).getTime();

/** Chart points, oldest first (finished workouts only). */
export function buildExerciseHistory(logs: WorkoutLogEntity[], exerciseId: string): ExerciseHistoryPoint[] {
  return logs
    .filter((log) => log.endedAt)
    .map((log) => toExerciseHistoryPoint(log, exerciseId))
    .filter((point): point is ExerciseHistoryPoint => point !== null)
    .sort((a, b) => time(a.date) - time(b.date));
}

/** Detailed sessions, newest first; not period-filtered (like the web accordion). */
export function buildExerciseSessions(logs: WorkoutLogEntity[], exerciseId: string): ExerciseHistorySession[] {
  return logs
    .filter((log) => log.endedAt)
    .map((log) => toExerciseHistorySession(log, exerciseId))
    .filter((session): session is ExerciseHistorySession => session !== null)
    .sort((a, b) => time(b.date) - time(a.date));
}

/** Number of finished workouts each exercise appears in. */
export function computeUsageCounts(logs: WorkoutLogEntity[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    if (!log.endedAt) continue;
    const seen = new Set<string>();
    for (const ex of log.exercises) {
      if (seen.has(ex.exerciseId)) continue;
      seen.add(ex.exerciseId);
      counts.set(ex.exerciseId, (counts.get(ex.exerciseId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Exercise ids with history, most used first. */
export function usedExerciseIds(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/** Best e1RM of the previous session that counts toward stats, for the history delta. */
export function previousCountedBest(sessions: ExerciseHistorySession[], index: number): number | null {
  if (sessions[index].excludeFromStats) return null;
  for (let k = index + 1; k < sessions.length; k++) {
    if (!sessions[k].excludeFromStats) return sessions[k].bestE1RM;
  }
  return null;
}
