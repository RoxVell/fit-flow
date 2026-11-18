import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";

export type PreviousSet = { weight: number; reps: number };

/** The input logs are newest first. An unfinished set leaves its slot available for older history. */
export function buildPreviousSetsMap(
  exercises: LoggedExercise[],
  workoutLogs: WorkoutLog[]
): Map<string, (PreviousSet | null)[]> {
  const history = new Map<string, Map<number, PreviousSet>>();
  for (const log of workoutLogs) {
    if (!log.endedAt) continue;
    for (const entry of log.exercises) {
      if (entry.excludeFromStats) continue;
      const previous = history.get(entry.exerciseId) ?? new Map<number, PreviousSet>();
      for (const set of entry.sets) {
        if (set.completed && !previous.has(set.setOrder)) {
          previous.set(set.setOrder, { weight: set.weight, reps: set.reps });
        }
      }
      history.set(entry.exerciseId, previous);
    }
  }
  return new Map(exercises.map((entry) => [
    entry.id,
    entry.sets.map((set) => history.get(entry.exerciseId)?.get(set.setOrder) ?? null),
  ]));
}
