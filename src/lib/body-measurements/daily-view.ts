import { compareByDate } from "@/lib/utils/date";
import { BODY_METRIC_FIELDS, calendarDayKey, hasBodyMetricValue, type BodyMetricValues } from "@/lib/body-measurements/metrics";
import type { BodyMeasurementEntity } from "@/lib/db/types";

export type DailyBodyView = BodyMetricValues & { date: string };

export function buildDailyBodyViews(
  snapshots: BodyMeasurementEntity[]
): DailyBodyView[] {
  const byDay = new Map<string, DailyBodyView>();
  const sorted = [...snapshots].sort((a, b) => compareByDate(a.updatedAt, b.updatedAt));
  for (const snapshot of sorted) {
    const date = calendarDayKey(snapshot.date);
    const view = byDay.get(date) ?? { date };
    for (const field of BODY_METRIC_FIELDS) {
      const value = snapshot[field];
      if (hasBodyMetricValue(value)) view[field] = value;
    }
    byDay.set(date, view);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeightTrendFromDailyViews(
  views: DailyBodyView[]
): { currentWeight: number | null; weightTrend: "up" | "down" | "stable" } {
  const withWeight = views.filter((view) => hasBodyMetricValue(view.weight));

  if (withWeight.length === 0) {
    return { currentWeight: null, weightTrend: "stable" };
  }

  const currentWeight = withWeight[withWeight.length - 1]!.weight!;

  if (withWeight.length < 2) {
    return { currentWeight, weightTrend: "stable" };
  }

  const prevWeight = withWeight[withWeight.length - 2]!.weight!;
  const weightTrend =
    currentWeight > prevWeight
      ? "up"
      : currentWeight < prevWeight
        ? "down"
        : "stable";

  return { currentWeight, weightTrend };
}
