import { MUSCLE_GROUPS, type MuscleGroup, type WorkoutLogEntity } from "@/lib/db/types";
import { getExerciseCatalog } from "@/lib/exercises/catalog";
import type { BodyPart } from "@/lib/exercises/types";

const BODY_PART_TO_MUSCLE: Record<BodyPart, MuscleGroup> = {
  CHEST: "chest",
  BACK: "back",
  SHOULDERS: "shoulders",
  BICEPS: "biceps",
  TRICEPS: "triceps",
  FOREARMS: "forearms",
  LEGS: "quads",
  GLUTEUS: "glutes",
  ABS: "abs",
};

/** Last 7 days of completed-set load, matching the web dashboard heatmap. */
export function buildWeeklyMuscleLoad(logs: WorkoutLogEntity[]): Record<MuscleGroup, number> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return buildMuscleLoad(logs.filter((log) => new Date(log.startedAt) >= weekAgo));
}

/** Sums completed sets per muscle group, weighted by the exercise's muscle split. */
export function buildMuscleLoad(
  logs: WorkoutLogEntity[],
): Record<MuscleGroup, number> {
  const heatmap = Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, 0])) as Record<MuscleGroup, number>;
  const catalog = new Map(getExerciseCatalog().map((item) => [item.id, item]));

  for (const log of logs) {
    for (const ex of log.exercises) {
      const item = catalog.get(ex.exerciseId);
      if (!item) continue;
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const weights = item.muscleWeights;
      if (weights && Object.keys(weights).length > 0) {
        for (const [group, percent] of Object.entries(weights)) {
          heatmap[group as MuscleGroup] += ((percent ?? 0) / 100) * completedSets.length;
        }
      } else {
        heatmap[BODY_PART_TO_MUSCLE[item.bodyPart]] += completedSets.length;
      }
    }
  }

  return heatmap;
}
