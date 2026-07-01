import type { BodyMeasurement } from "@/lib/db/types";

export const BODY_SINGLE_METRIC_FIELDS = ["weight", "chest", "waist"] as const;

export const BODY_BILATERAL_METRIC_GROUPS = [
  { labelKey: "arms", left: "leftArm", right: "rightArm" },
  { labelKey: "thighs", left: "leftThigh", right: "rightThigh" },
  { labelKey: "calves", left: "leftCalf", right: "rightCalf" },
] as const satisfies ReadonlyArray<{
  labelKey: "arms" | "thighs" | "calves";
  left: keyof BodyMeasurement;
  right: keyof BodyMeasurement;
}>;

export const BODY_SIDED_METRIC_FIELDS = BODY_BILATERAL_METRIC_GROUPS.flatMap(
  (group) => [group.left, group.right]
) as [
  "leftArm",
  "rightArm",
  "leftThigh",
  "rightThigh",
  "leftCalf",
  "rightCalf",
];

/** @deprecated Legacy combined limb fields — still read for older snapshots */
export const LEGACY_BODY_METRIC_FIELDS = ["arms", "thighs", "calves"] as const;

export const BODY_METRIC_FIELDS = [
  ...BODY_SINGLE_METRIC_FIELDS,
  ...BODY_SIDED_METRIC_FIELDS,
] as const;

export type BodyMetricField = (typeof BODY_METRIC_FIELDS)[number];
export type LegacyBodyMetricField = (typeof LEGACY_BODY_METRIC_FIELDS)[number];

export type BodyMetricValues = Pick<BodyMeasurement, BodyMetricField>;

export function hasBodyMetricValue(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value);
}

export function hasAnyBodyMetric(data: Partial<BodyMeasurement>): boolean {
  return (
    BODY_METRIC_FIELDS.some((field) => hasBodyMetricValue(data[field])) ||
    LEGACY_BODY_METRIC_FIELDS.some((field) => hasBodyMetricValue(data[field]))
  );
}

export function calendarDayKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
