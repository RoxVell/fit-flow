import type { BodyMeasurementEntity, WorkoutLog, WorkoutLogEntity } from "@/lib/db/types";
import { volume } from "@/lib/training-metrics";

import { buildDailyBodyViews, getWeightTrendFromDailyViews, type WeightTrend } from "./daily-body-view";

export type DashboardSummary = {
  currentWeight: number | null;
  weightTrend: WeightTrend;
  hasWeightHistory: boolean;
  /** Distinct days with a workout in the last 7 days. */
  activeDays: number;
};

// Port of the web useDashboardStats (src/lib/hooks/use-data.ts), minus the
// muscle heatmap and next-session fields the mobile dashboard does not show.
export function computeDashboardStats(
  logs: WorkoutLogEntity[],
  measurements: BodyMeasurementEntity[],
  now = new Date(),
): DashboardSummary {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = logs.filter((l) => new Date(l.startedAt) >= weekAgo);
  const activeDays = new Set(thisWeek.map((l) => new Date(l.startedAt).toDateString())).size;

  const dailyViews = buildDailyBodyViews(measurements);
  const { currentWeight, weightTrend } = getWeightTrendFromDailyViews(dailyViews);
  const hasWeightHistory = dailyViews.some((view) => view.weight != null);

  return { currentWeight, weightTrend, hasWeightHistory, activeDays };
}

/** Total volume of completed sets in a log. */
export function workoutVolume(log: WorkoutLog): number {
  return log.exercises.reduce((sum, e) => sum + volume(e.sets.filter((s) => s.completed)), 0);
}
