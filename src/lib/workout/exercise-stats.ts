import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";

export function isExcludedFromStats(
  exercise: Pick<LoggedExercise, "excludeFromStats">
): boolean {
  return Boolean(exercise.excludeFromStats);
}

export function findLoggedExercise(
  exercises: LoggedExercise[],
  exerciseId: string
): LoggedExercise | undefined {
  return exercises.find((exercise) => exercise.exerciseId === exerciseId);
}

export type ExerciseHistoryPoint = {
  date: string;
  volume: number;
  maxWeight: number;
  estimated1RM: number;
};

export type ExerciseDetailedHistorySession = {
  date: string;
  bestE1RM: number;
  excludeFromStats: boolean;
  notes?: string;
  sets: {
    weight: number;
    reps: number;
    type: string;
    setOrder: number;
  }[];
};

export function toExerciseHistoryPoint(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string
): ExerciseHistoryPoint | null {
  const exercise = findLoggedExercise(log.exercises, exerciseId);
  if (!exercise || isExcludedFromStats(exercise)) return null;

  const completed = exercise.sets.filter((set) => set.completed);
  return {
    date: log.startedAt,
    volume: volume(completed),
    maxWeight: bestWeight(completed),
    estimated1RM: bestE1RM(completed),
  };
}

export function toExerciseDetailedHistorySession(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string
): ExerciseDetailedHistorySession | null {
  const exercise = findLoggedExercise(log.exercises, exerciseId);
  if (!exercise) return null;

  const completed = exercise.sets.filter((set) => set.completed);
  const notes = exercise.notes?.trim();
  return {
    date: log.startedAt,
    bestE1RM: bestE1RM(completed),
    excludeFromStats: isExcludedFromStats(exercise),
    notes: notes ? notes : undefined,
    sets: completed.map((set) => ({
      weight: set.weight,
      reps: set.reps,
      type: set.type,
      setOrder: set.setOrder,
    })),
  };
}
