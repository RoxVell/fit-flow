export type ChartPeriod = "1m" | "2m" | "3m" | "6m" | "all";

export const DEFAULT_CHART_PERIOD: ChartPeriod = "1m";

export const CHART_PERIOD_DAYS: Record<ChartPeriod, number> = {
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  all: Infinity,
};

export function filterByPeriod<T extends { date: string }>(
  items: T[],
  period: ChartPeriod
): T[] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return items;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter((item) => new Date(item.date) >= cutoff);
}

export function filterDatesByPeriod(dates: string[], period: ChartPeriod): string[] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return dates;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return dates.filter((date) => new Date(date) >= cutoff);
}
