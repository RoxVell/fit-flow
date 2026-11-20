// Chart period presets (web: src/lib/charts/periods.ts). The period type and
// the weekly-series filter already live in the dashboard port; re-exported here
// so progress code has one import path.
export { CHART_PERIODS, DEFAULT_CHART_PERIOD, type ChartPeriod } from "@/lib/dashboard/progress";

import type { ChartPeriod } from "@/lib/dashboard/progress";

export const CHART_PERIOD_DAYS: Record<ChartPeriod, number> = {
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  all: Infinity,
};

export function filterByPeriod<T extends { date: string }>(items: T[], period: ChartPeriod, now = new Date()): T[] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return items;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter((item) => new Date(item.date) >= cutoff);
}
