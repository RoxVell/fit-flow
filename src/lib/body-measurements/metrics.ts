import type { BodyMeasurement } from "@/lib/db/types";

export const BODY_METRIC_FIELDS = [
  "weight",
  "chest",
  "waist",
  "arms",
  "thighs",
  "calves",
] as const;

export type BodyMetricField = (typeof BODY_METRIC_FIELDS)[number];

export type BodyMetricValues = Pick<BodyMeasurement, BodyMetricField>;

export function hasBodyMetricValue(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value);
}

export function hasAnyBodyMetric(data: Partial<BodyMetricValues>): boolean {
  return BODY_METRIC_FIELDS.some((field) => hasBodyMetricValue(data[field]));
}

export function calendarDayKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
