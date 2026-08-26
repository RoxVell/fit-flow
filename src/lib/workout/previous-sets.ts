import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";

export type PreviousSet = { weight: number; reps: number };

function completedSets(loggedEx: LoggedExercise) {
  return [...loggedEx.sets]
    .filter((s) => s.completed)
    .sort((a, b) => a.setOrder - b.setOrder);
}

/** Last completed weight×reps for each set index across workout history. */
export function buildPreviousSetsMap(
  exercises: LoggedExercise[],
  workoutLogs: WorkoutLog[]
): Map<string, (PreviousSet | null)[]> {
  const map = new Map<string, (PreviousSet | null)[]>();

  for (const ex of exercises) {
    const previous: (PreviousSet | null)[] = [];

    for (let setIndex = 0; setIndex < ex.sets.length; setIndex++) {
      let found: PreviousSet | null = null;

      for (const log of workoutLogs) {
        const loggedEx = log.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (!loggedEx || loggedEx.excludeFromStats) continue;

        const set = completedSets(loggedEx)[setIndex];
        if (set) {
          found = { weight: set.weight, reps: set.reps };
          break;
        }
      }

      previous.push(found);
    }

    map.set(ex.id, previous);
  }

  return map;
}
