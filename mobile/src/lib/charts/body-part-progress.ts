// Body-part progress lines and summaries: port of the body-part parts of the
// web app's src/lib/charts/weekly-progress.ts (CONTEXT.md, "body part progress").
import {
  buildPerExerciseBaseline,
  buildWeeklyExerciseBest1RM,
  computePeriodChange,
  filterWeeksByPeriod,
  getSortedWeeks,
  type ChartPeriod,
  type PeriodChange,
  type WeekEntry,
} from "@/lib/dashboard/progress";
import type { WorkoutLogEntity } from "@/lib/db/types";
import type { BodyPart } from "@/lib/exercises/types";

import type { ChartPoint } from "./domain";

const BODY_PART_ORDER: BodyPart[] = ["ABS", "BACK", "BICEPS", "CHEST", "FOREARMS", "GLUTEUS", "LEGS", "SHOULDERS", "TRICEPS"];

function sortBodyParts(bodyParts: BodyPart[]): BodyPart[] {
  return [...bodyParts].sort((a, b) => BODY_PART_ORDER.indexOf(a) - BODY_PART_ORDER.indexOf(b));
}

function progressPercent(value: number, baseValue: number): number {
  return Math.round((value / baseValue) * 1000) / 10;
}

function getPeriodCohort(filteredWeeks: WeekEntry[]): Set<string> {
  const cohort = new Set<string>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) cohort.add(exId);
  }
  return cohort;
}

function buildPeriodStartProgress(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  cohort: Set<string>,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const exId of cohort) {
    for (const [, exercises] of filteredWeeks) {
      const value = exercises.get(exId);
      const baseValue = baseline.get(exId);
      if (value !== undefined && baseValue && baseValue > 0) {
        result.set(exId, progressPercent(value, baseValue));
        break;
      }
    }
  }
  return result;
}

function updateRunningProgress(running: Map<string, number>, weekExercises: Map<string, number>, baseline: Map<string, number>) {
  for (const [exId, value] of weekExercises) {
    const baseValue = baseline.get(exId);
    if (baseValue && baseValue > 0) running.set(exId, progressPercent(value, baseValue));
  }
}

function computePeriodIndexedAverage(
  cohort: Set<string>,
  periodStart: Map<string, number>,
  running: Map<string, number>,
): number | null {
  let total = 0;
  let count = 0;
  for (const exId of cohort) {
    const start = periodStart.get(exId);
    const current = running.get(exId);
    if (start && start > 0 && current !== undefined) {
      total += (current / start) * 100;
      count++;
    }
  }
  return count > 0 ? Math.round((total / count) * 10) / 10 : null;
}

/** Exercises logged in at least two weeks of the period; one-offs would dilute the line. */
function getRepeatSessionExerciseIds(filteredWeeks: WeekEntry[]): Set<string> {
  const counts = new Map<string, number>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) counts.set(exId, (counts.get(exId) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count >= 2).map(([exId]) => exId));
}

export type BodyPartRow = { week: string } & Partial<Record<BodyPart, number>>;

/** Weekly body-part lines indexed to 100 at each exercise's first week in the period. */
export function computeBodyPartProgressSeries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  formatChartDate: (iso: string) => string,
): { chartData: BodyPartRow[]; bodyParts: BodyPart[] } {
  const periodCohort = getPeriodCohort(filteredWeeks);
  const withData = new Set<BodyPart>();
  for (const exId of periodCohort) {
    const bodyPart = exerciseBodyPart.get(exId);
    if (bodyPart) withData.add(bodyPart);
  }

  const bodyParts = sortBodyParts([...withData]);
  const repeatIds = getRepeatSessionExerciseIds(filteredWeeks);
  const cohorts = new Map<BodyPart, Set<string>>();
  for (const bodyPart of bodyParts) {
    const cohort = new Set<string>();
    for (const exId of periodCohort) {
      if (exerciseBodyPart.get(exId) === bodyPart && repeatIds.has(exId)) cohort.add(exId);
    }
    cohorts.set(bodyPart, cohort);
  }

  const periodStart = buildPeriodStartProgress(filteredWeeks, baseline, periodCohort);
  const running = new Map<string, number>();

  const chartData = filteredWeeks.map(([weekStart, exercises]) => {
    const row: BodyPartRow = { week: formatChartDate(weekStart) };
    updateRunningProgress(running, exercises, baseline);
    for (const bodyPart of bodyParts) {
      const indexed = computePeriodIndexedAverage(cohorts.get(bodyPart)!, periodStart, running);
      if (indexed !== null) row[bodyPart] = indexed;
    }
    return row;
  });

  const activeBodyParts = sortBodyParts(bodyParts.filter((bp) => chartData.some((row) => row[bp] !== undefined)));
  return { chartData, bodyParts: activeBodyParts };
}

export interface ExerciseProgressSummary {
  exerciseId: string;
  current: number | null;
  change: PeriodChange | null;
}

export function computeExerciseProgressSummaries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  bodyPart: BodyPart,
): ExerciseProgressSummary[] {
  const summaries: ExerciseProgressSummary[] = [];
  for (const [exerciseId, baseValue] of baseline) {
    if (exerciseBodyPart.get(exerciseId) !== bodyPart || baseValue <= 0) continue;
    const values: number[] = [];
    for (const [, exercises] of filteredWeeks) {
      const value = exercises.get(exerciseId);
      if (value !== undefined) values.push(progressPercent(value, baseValue));
    }
    if (values.length === 0) continue;
    summaries.push({ exerciseId, current: values[values.length - 1], change: computePeriodChange(values) });
  }
  return summaries.sort((a, b) => (b.current ?? 0) - (a.current ?? 0));
}

/** Period change per body-part line (first vs last chart point), like General progress. */
export function computeBodyPartChartChanges(chartData: BodyPartRow[], bodyParts: BodyPart[]): Map<BodyPart, PeriodChange | null> {
  const changes = new Map<BodyPart, PeriodChange | null>();
  for (const bodyPart of bodyParts) {
    const values = chartData.map((row) => row[bodyPart]).filter((v): v is number => typeof v === "number");
    changes.set(bodyPart, computePeriodChange(values));
  }
  return changes;
}

/** One body part's line as chart points (weeks without a value are skipped). */
export function bodyPartSeries(chartData: BodyPartRow[], bodyPart: BodyPart): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (const row of chartData) {
    const value = row[bodyPart];
    if (typeof value === "number") points.push({ x: row.week, y: value });
  }
  return points;
}

export type BodyPartProgressModel = {
  chartData: BodyPartRow[];
  bodyParts: BodyPart[];
  changes: Map<BodyPart, PeriodChange | null>;
  exerciseSummaries: Map<BodyPart, ExerciseProgressSummary[]>;
};

/** Full pipeline for the card; null when there are fewer than two weeks or no body parts with data. */
export function buildBodyPartProgress(
  logs: WorkoutLogEntity[],
  period: ChartPeriod,
  exerciseBodyPart: Map<string, BodyPart>,
  formatChartDate: (iso: string) => string,
): BodyPartProgressModel | null {
  if (logs.length === 0) return null;
  const sortedWeeks = getSortedWeeks(buildWeeklyExerciseBest1RM(logs));
  if (sortedWeeks.length < 2) return null;
  const filteredWeeks = filterWeeksByPeriod(sortedWeeks, period);
  if (filteredWeeks.length < 2) return null;

  const baseline = buildPerExerciseBaseline(sortedWeeks);
  const series = computeBodyPartProgressSeries(filteredWeeks, baseline, exerciseBodyPart, formatChartDate);
  if (series.bodyParts.length === 0) return null;

  const exerciseSummaries = new Map<BodyPart, ExerciseProgressSummary[]>();
  for (const bodyPart of series.bodyParts) {
    exerciseSummaries.set(bodyPart, computeExerciseProgressSummaries(filteredWeeks, baseline, exerciseBodyPart, bodyPart));
  }

  return {
    chartData: series.chartData,
    bodyParts: series.bodyParts,
    changes: computeBodyPartChartChanges(series.chartData, series.bodyParts),
    exerciseSummaries,
  };
}
