import {
  BODY_METRIC_FIELDS,
  hasBodyMetricValue,
} from "@/lib/body-measurements/metrics";
import type { BodyMeasurement } from "@/lib/db/types";
import { formatDateKey } from "@/lib/utils/date";

type SnapshotSummary = {
  [K in (typeof BODY_METRIC_FIELDS)[number]]: (v: number) => string;
};

export function formatSnapshotSummary(
  snapshot: Pick<BodyMeasurement, (typeof BODY_METRIC_FIELDS)[number]>,
  summary: SnapshotSummary
): string {
  const parts: string[] = [];

  for (const field of BODY_METRIC_FIELDS) {
    const value = snapshot[field];
    if (!hasBodyMetricValue(value)) continue;
    parts.push(summary[field](value));
  }

  return parts.join(" · ");
}

export function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dateInputToIso(date: string | Date): string {
  const day = date instanceof Date ? formatDateKey(date) : date;
  return new Date(`${day}T12:00:00`).toISOString();
}
