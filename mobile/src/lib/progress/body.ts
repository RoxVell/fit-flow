// Body view helpers: port of the web app's src/lib/body-measurements/
// {metrics,snapshot-summary}.ts on top of the mobile measurements repository.
import type { DailyBodyView } from "@/lib/dashboard/daily-body-view";
import { formatDateKey } from "@/lib/dashboard/date";
import type { BodyMeasurement } from "@/lib/db/types";
import { BODY_METRIC_FIELDS, hasBodyMetricValue, type BodyMetricField } from "@/lib/repositories/measurements";

import type { ChartPoint } from "@/lib/charts/domain";

export const BODY_SINGLE_METRIC_FIELDS = ["weight", "chest", "waist"] as const;

export const BODY_BILATERAL_METRIC_GROUPS = [
  { labelKey: "arms", left: "leftArm", right: "rightArm" },
  { labelKey: "thighs", left: "leftThigh", right: "rightThigh" },
  { labelKey: "calves", left: "leftCalf", right: "rightCalf" },
] as const satisfies ReadonlyArray<{ labelKey: "arms" | "thighs" | "calves"; left: BodyMetricField; right: BodyMetricField }>;

export const CIRCUMFERENCE_FIELDS = BODY_METRIC_FIELDS.filter((field) => field !== "weight");

export type MetricUnit = "kg" | "cm";

export function metricUnit(field: BodyMetricField): MetricUnit {
  return field === "weight" ? "kg" : "cm";
}

export type MetricValues = Record<BodyMetricField, string>;

export function emptyMetricValues(): MetricValues {
  return Object.fromEntries(BODY_METRIC_FIELDS.map((field) => [field, ""])) as MetricValues;
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseMetricValues(values: MetricValues): Partial<Record<BodyMetricField, number>> {
  const result: Partial<Record<BodyMetricField, number>> = {};
  for (const field of BODY_METRIC_FIELDS) {
    const parsed = parseOptionalNumber(values[field]);
    if (parsed !== undefined) result[field] = parsed;
  }
  return result;
}

export type SnapshotSummaryFormatters = Record<BodyMetricField, (v: number) => string>;

/** `80 kg · 85 cm waist` — only the fields that were filled. */
export function formatSnapshotSummary(
  snapshot: Pick<BodyMeasurement, BodyMetricField>,
  summary: SnapshotSummaryFormatters,
): string {
  const parts: string[] = [];
  for (const field of BODY_METRIC_FIELDS) {
    const value = snapshot[field];
    if (hasBodyMetricValue(value)) parts.push(summary[field](value));
  }
  return parts.join(" · ");
}

export function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Snapshot date: the chosen calendar day at local noon, so it stays on that day in any timezone. */
export function dateToSnapshotIso(date: Date): string {
  return new Date(`${formatDateKey(date)}T12:00:00`).toISOString();
}

/** Daily values of one metric as chart points (days without it are skipped). */
export function metricSeries(views: DailyBodyView[], field: BodyMetricField, formatDate: (iso: string) => string): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (const view of views) {
    const value = view[field];
    if (hasBodyMetricValue(value)) points.push({ x: formatDate(view.date), y: value });
  }
  return points;
}

/** Fields that have at least one value in the given views, in canonical order. */
export function fieldsWithData(views: DailyBodyView[], fields: readonly BodyMetricField[]): BodyMetricField[] {
  return fields.filter((field) => views.some((view) => hasBodyMetricValue(view[field])));
}
