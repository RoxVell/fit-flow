import type { Exercise, PersonalRecord, PRType, WorkoutLog } from "@/lib/db/types";
import { aggregateExerciseStats } from "./exercise-stats";

/** Rebuild record events from history so edits, deletions and sync cannot leave stale PRs. */
export function derivePersonalRecords(
  logs: (WorkoutLog & { deletedAt?: string })[],
  exerciseMap: Map<string, Exercise>
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const best = new Map<string, number>();
  const completed = logs.filter((log) => log.endedAt && !log.deletedAt).sort((a, b) =>
    a.endedAt!.localeCompare(b.endedAt!) || a.id.localeCompare(b.id)
  );
  for (const log of completed) {
    for (const exerciseId of new Set(log.exercises.map((exercise) => exercise.exerciseId))) {
      const stats = aggregateExerciseStats(log.exercises, exerciseId);
      const values: [PRType, number][] = [
        ["weight", stats.maxWeight],
        ["volume", stats.volume],
        ["estimated_1rm", Math.round((stats.estimated1RM ?? 0) * 10) / 10],
      ];
      const snapshot = log.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.exercise;
      for (const [type, value] of values) {
        const key = `${exerciseId}:${type}`;
        if (value <= (best.get(key) ?? 0)) continue;
        best.set(key, value);
        records.push({
          id: `${log.id}:${key}`, workoutLogId: log.id, exerciseId,
          exerciseName: exerciseMap.get(exerciseId)?.name ?? snapshot?.name ?? exerciseId,
          type, value, date: log.endedAt!,
        });
      }
    }
  }
  return records;
}
