// "General progress" series: port of the overall-progress parts of the web
// app's src/lib/charts/{weekly-progress,domain,periods}.ts. See CONTEXT.md,
// "progress index" and docs/progress-charts.md.
import type { WorkoutLogEntity } from "@/lib/db/types";
import { e1RM } from "@/lib/training-metrics";

export type ChartPeriod = "1m" | "2m" | "3m" | "6m" | "all";

export const CHART_PERIODS: ChartPeriod[] = ["1m", "2m", "3m", "6m", "all"];
export const DEFAULT_CHART_PERIOD: ChartPeriod = "1m";

const CHART_PERIOD_DAYS: Record<ChartPeriod, number> = {
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  all: Infinity,
};

/** Week start ISO string plus each exercise's best e1RM for that week. */
export type WeekEntry = [string, Map<string, number>];

export type ProgressPoint = { week: string; progress: number };

export type PeriodChange = { absolute: number; percent: number };

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Progress vs baseline as a percentage with one decimal (100 = baseline). */
function progressPercent(value: number, baseValue: number): number {
  return Math.round((value / baseValue) * 1000) / 10;
}

export function buildWeeklyExerciseBest1RM(logs: WorkoutLogEntity[]): Map<string, Map<string, number>> {
  const weeksMap = new Map<string, Map<string, number>>();

  for (const log of logs) {
    if (!log.endedAt) continue;
    const weekStart = getMonday(new Date(log.endedAt)).toISOString();
    let weekExercises = weeksMap.get(weekStart);
    if (!weekExercises) {
      weekExercises = new Map();
      weeksMap.set(weekStart, weekExercises);
    }

    for (const ex of log.exercises) {
      if (ex.excludeFromStats) continue;
      let best1RM = 0;
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
        best1RM = Math.max(best1RM, e1RM(set.weight, set.reps));
      }
      if (best1RM > (weekExercises.get(ex.exerciseId) ?? 0)) {
        weekExercises.set(ex.exerciseId, best1RM);
      }
    }
  }

  return weeksMap;
}

export function getSortedWeeks(weeksMap: Map<string, Map<string, number>>): WeekEntry[] {
  return [...weeksMap.entries()].sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
}

export function filterWeeksByPeriod(sortedWeeks: WeekEntry[], period: ChartPeriod, now = new Date()): WeekEntry[] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return sortedWeeks;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return sortedWeeks.filter(([weekStart]) => new Date(weekStart) >= cutoff);
}

/** Each exercise's best e1RM from the first week it appears in history. */
export function buildPerExerciseBaseline(sortedWeeks: WeekEntry[]): Map<string, number> {
  const baseline = new Map<string, number>();
  for (const [, exercises] of sortedWeeks) {
    for (const [exId, value] of exercises) {
      if (!baseline.has(exId)) baseline.set(exId, value);
    }
  }
  return baseline;
}

function getPeriodStartProgress(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseId: string,
): number | null {
  for (const [, exercises] of filteredWeeks) {
    const value = exercises.get(exerciseId);
    const baseValue = baseline.get(exerciseId);
    if (value !== undefined && baseValue && baseValue > 0) return progressPercent(value, baseValue);
  }
  return null;
}

/** Weekly series indexed to 100 at each exercise's first week in the period. */
export function computeOverallProgressSeries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  formatChartDate: (iso: string) => string,
): ProgressPoint[] {
  const cohort = new Set<string>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) cohort.add(exId);
  }

  const periodStartProgress = new Map<string, number>();
  for (const exId of cohort) {
    const start = getPeriodStartProgress(filteredWeeks, baseline, exId);
    if (start !== null) periodStartProgress.set(exId, start);
  }

  const runningProgress = new Map<string, number>();
  return filteredWeeks.map(([weekStart, exercises]) => {
    for (const [exId, value] of exercises) {
      const baseValue = baseline.get(exId);
      if (baseValue && baseValue > 0) runningProgress.set(exId, progressPercent(value, baseValue));
    }

    let total = 0;
    let count = 0;
    for (const exId of cohort) {
      const start = periodStartProgress.get(exId);
      const current = runningProgress.get(exId);
      if (start && start > 0 && current !== undefined) {
        total += (current / start) * 100;
        count++;
      }
    }
    return {
      week: formatChartDate(weekStart),
      progress: count > 0 ? Math.round((total / count) * 10) / 10 : 100,
    };
  });
}

export function computePeriodChange(values: number[]): PeriodChange | null {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  return {
    absolute: Math.round((last - first) * 10) / 10,
    percent: first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0,
  };
}

/** Full pipeline for the dashboard card; null when there are fewer than two weeks. */
export function buildGeneralProgress(
  logs: WorkoutLogEntity[],
  period: ChartPeriod,
  formatChartDate: (iso: string) => string,
): { points: ProgressPoint[]; change: PeriodChange } | null {
  if (logs.length === 0) return null;
  const sortedWeeks = getSortedWeeks(buildWeeklyExerciseBest1RM(logs));
  if (sortedWeeks.length < 2) return null;
  const filteredWeeks = filterWeeksByPeriod(sortedWeeks, period);
  if (filteredWeeks.length < 2) return null;
  const points = computeOverallProgressSeries(filteredWeeks, buildPerExerciseBaseline(sortedWeeks), formatChartDate);
  const change = computePeriodChange(points.map((p) => p.progress));
  return change ? { points, change } : null;
}
