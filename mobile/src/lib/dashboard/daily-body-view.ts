import type { BodyMeasurementEntity } from "@/lib/db/types";
import { BODY_METRIC_FIELDS, hasBodyMetricValue, type BodyMetricField } from "@/lib/repositories/measurements";

import { formatDateKey } from "./date";

/** Merged snapshots of one calendar day (CONTEXT.md, "daily body view"). */
export type DailyBodyView = { date: string } & Partial<Record<BodyMetricField, number>>;

export type WeightTrend = "up" | "down" | "stable";

export function buildDailyBodyViews(snapshots: BodyMeasurementEntity[]): DailyBodyView[] {
  const byDay = new Map<string, BodyMeasurementEntity[]>();
  for (const snapshot of snapshots) {
    const day = formatDateKey(new Date(snapshot.date));
    byDay.set(day, [...(byDay.get(day) ?? []), snapshot]);
  }

  const views: DailyBodyView[] = [];
  for (const [day, daySnapshots] of byDay) {
    const sorted = [...daySnapshots].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );
    // Last non-null value wins per field.
    const view: DailyBodyView = { date: day };
    for (const snapshot of sorted) {
      for (const field of BODY_METRIC_FIELDS) {
        const value = snapshot[field];
        if (hasBodyMetricValue(value)) view[field] = value;
      }
    }
    views.push(view);
  }

  return views.sort((a, b) => a.date.localeCompare(b.date));
}

/** Latest weight and its direction vs the previous day that has a weight. */
export function getWeightTrendFromDailyViews(views: DailyBodyView[]): {
  currentWeight: number | null;
  weightTrend: WeightTrend;
} {
  const weights = views.map((v) => v.weight).filter(hasBodyMetricValue);
  if (weights.length === 0) return { currentWeight: null, weightTrend: "stable" };

  const currentWeight = weights[weights.length - 1];
  if (weights.length < 2) return { currentWeight, weightTrend: "stable" };

  const prevWeight = weights[weights.length - 2];
  const weightTrend = currentWeight > prevWeight ? "up" : currentWeight < prevWeight ? "down" : "stable";
  return { currentWeight, weightTrend };
}
