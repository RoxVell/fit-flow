// Period change helpers (web: src/lib/charts/domain.ts).
//
// The web's `computeFocusDomain` (Y axis trimmed below the data minimum) has no
// counterpart here: `@expo/ui` Chart does not expose the Y scale domain, and
// Swift Charts anchors it at zero. Instead series are plotted as a delta vs the
// period start (`toDeltaSeries`), which keeps small changes readable.
export { computePeriodChange, type PeriodChange } from "@/lib/dashboard/progress";

import type { PeriodChange } from "@/lib/dashboard/progress";

export type ChartPoint = { x: string; y: number };

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Shifts a series so the first value is 0; the chart then shows change vs period start. */
export function toDeltaSeries(points: ChartPoint[]): ChartPoint[] {
  if (points.length === 0) return points;
  const first = points[0].y;
  return points.map((p) => ({ x: p.x, y: round1(p.y - first) }));
}

export function signed(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

export function formatPeriodChange(change: PeriodChange, unit: string): { absoluteLabel: string; percentLabel: string } {
  return {
    absoluteLabel: `${signed(change.absolute)} ${unit}`,
    percentLabel: `${signed(change.percent)}%`,
  };
}
