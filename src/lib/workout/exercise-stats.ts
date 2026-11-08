import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";
import { bestE1RM, bestWeight, volume, type SetMetrics } from "@/lib/training-metrics";

export function isExcludedFromStats(
  exercise: Pick<LoggedExercise, "excludeFromStats">
): boolean {
  return Boolean(exercise.excludeFromStats);
}

/** Completed, counted sets across every occurrence of an exercise in a workout. */
export function aggregateExerciseStats<S extends SetMetrics & { completed: boolean }>(
  exercises: { exerciseId: string; excludeFromStats?: boolean; sets: S[] }[],
  exerciseId?: string
) {
  const sets = exercises
    .filter((exercise) => !exercise.excludeFromStats &&
      (exerciseId === undefined || exercise.exerciseId === exerciseId))
    .flatMap((exercise) => exercise.sets.filter((set) => set.completed));
  const weighted = sets.filter((set) => set.weight > 0 && set.reps > 0);
  return {
    sets,
    volume: volume(sets),
    maxWeight: bestWeight(sets),
    estimated1RM: weighted.length ? bestE1RM(weighted) : null,
  };
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
    excludeFromStats?: boolean;
  }[];
};

export function toExerciseHistoryPoint(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string
): ExerciseHistoryPoint | null {
  const stats = aggregateExerciseStats(log.exercises, exerciseId);
  if (!stats.sets.length) return null;
  return {
    date: log.startedAt,
    volume: stats.volume,
    maxWeight: stats.maxWeight,
    estimated1RM: stats.estimated1RM ?? 0,
  };
}

export function toExerciseDetailedHistorySession(
  log: Pick<WorkoutLog, "startedAt" | "exercises">,
  exerciseId: string
): ExerciseDetailedHistorySession | null {
  const exercises = log.exercises
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!exercises.length) return null;

  const sets = exercises.flatMap((exercise) => exercise.sets
    .filter((set) => set.completed)
    .sort((a, b) => a.setOrder - b.setOrder)
    .map((set) => ({ ...set, excludeFromStats: Boolean(exercise.excludeFromStats) })));
  const excluded = exercises.every(isExcludedFromStats);
  const stats = aggregateExerciseStats(exercises);
  const notes = exercises.map((exercise) => exercise.notes?.trim()).filter(Boolean).join("\n");
  return {
    date: log.startedAt,
    bestE1RM: excluded ? bestE1RM(sets.filter((set) => set.weight > 0 && set.reps > 0)) : stats.estimated1RM ?? 0,
    excludeFromStats: excluded,
    notes: notes ? notes : undefined,
    sets: sets.map((set, index) => ({
      weight: set.weight,
      reps: set.reps,
      type: set.type,
      setOrder: index,
      excludeFromStats: set.excludeFromStats,
    })),
  };
}
