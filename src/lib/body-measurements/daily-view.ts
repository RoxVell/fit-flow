import {
  BODY_METRIC_FIELDS,
  LEGACY_BODY_METRIC_FIELDS,
  calendarDayKey,
  hasBodyMetricValue,
} from "@/lib/body-measurements/metrics";
import type { BodyMeasurementEntity } from "@/lib/db/types";

export interface DailyBodyView {
  date: string;
  weight?: number;
  chest?: number;
  waist?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  /** @deprecated Legacy combined limb values from older snapshots */
  arms?: number;
  thighs?: number;
  calves?: number;
}

const DAILY_VIEW_FIELDS = [...BODY_METRIC_FIELDS, ...LEGACY_BODY_METRIC_FIELDS] as const;

export function buildDailyBodyViews(
  snapshots: BodyMeasurementEntity[]
): DailyBodyView[] {
  const byDay = new Map<string, BodyMeasurementEntity[]>();

  for (const snapshot of snapshots) {
    const day = calendarDayKey(snapshot.date);
    const daySnapshots = byDay.get(day) ?? [];
    daySnapshots.push(snapshot);
    byDay.set(day, daySnapshots);
  }

  const views: DailyBodyView[] = [];

  for (const [day, daySnapshots] of byDay) {
    const sorted = [...daySnapshots].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );

    const view: DailyBodyView = { date: day };
    for (const snapshot of sorted) {
      for (const field of DAILY_VIEW_FIELDS) {
        const value = snapshot[field];
        if (hasBodyMetricValue(value)) {
          view[field] = value;
        }
      }
    }

    views.push(view);
  }

  return views.sort((a, b) => a.date.localeCompare(b.date));
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
