import {
  BODY_METRIC_FIELDS,
  hasBodyMetricValue,
} from "@/lib/body-measurements/metrics";
import type { BodyMeasurement } from "@/lib/db/types";

type SnapshotSummary = {
  weight: (v: number) => string;
  chest: (v: number) => string;
  waist: (v: number) => string;
  arms: (v: number) => string;
  thighs: (v: number) => string;
  calves: (v: number) => string;
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

export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dateInputToIso(date: string | Date): string {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return new Date(`${year}-${month}-${day}T12:00:00`).toISOString();
  }

  return new Date(`${date}T12:00:00`).toISOString();
}
