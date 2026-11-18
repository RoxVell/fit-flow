import { startOfWeek } from "date-fns";
import type { WorkoutLogEntity } from "@/lib/db/types";
import type { BodyPart } from "@/lib/exercises/types";
import { aggregateExerciseStats } from "@/lib/workout/exercise-stats";
import { CHART_PERIOD_DAYS, type ChartPeriod } from "./periods";
import { computePeriodChange, type PeriodChange } from "./domain";

/** Week start ISO string plus each exercise's best e1RM for that week. */
export type WeekEntry = [string, Map<string, number>];

/** Progress vs baseline as a percentage with one decimal (100 = baseline). */
function progressPercent(value: number, baseValue: number): number {
  return Math.round((value / baseValue) * 1000) / 10;
}

export function buildWeeklyExerciseBest1RM(
  logs: WorkoutLogEntity[]
): Map<string, Map<string, number>> {
  const weeksMap = new Map<string, Map<string, number>>();

  for (const log of logs) {
    if (!log.endedAt || log.deletedAt) continue;
    const weekStart = startOfWeek(new Date(log.startedAt), { weekStartsOn: 1 }).toISOString();

    if (!weeksMap.has(weekStart)) {
      weeksMap.set(weekStart, new Map());
    }
    const weekExercises = weeksMap.get(weekStart)!;

    for (const exerciseId of new Set(log.exercises.map((exercise) => exercise.exerciseId))) {
      const { estimated1RM } = aggregateExerciseStats(log.exercises, exerciseId);
      if (estimated1RM === null) continue;
      weekExercises.set(exerciseId, Math.max(weekExercises.get(exerciseId) ?? 0, estimated1RM));
    }
  }

  return weeksMap;
}

export function getSortedWeeks(
  weeksMap: Map<string, Map<string, number>>
): WeekEntry[] {
  return [...weeksMap.entries()].sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );
}

export function filterWeeksByPeriod(
  sortedWeeks: WeekEntry[],
  period: ChartPeriod
): WeekEntry[] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return sortedWeeks;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sortedWeeks.filter(([weekStart]) => new Date(weekStart) >= cutoff);
}

export function buildPerExerciseBaseline(
  sortedWeeks: WeekEntry[]
): Map<string, number> {
  const baseline = new Map<string, number>();
  for (const [, exercises] of sortedWeeks) {
    for (const [exId, value] of exercises) {
      if (!baseline.has(exId)) {
        baseline.set(exId, value);
      }
    }
  }
  return baseline;
}

function buildPeriodStartProgress(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>
): Map<string, number> {
  const starts = new Map<string, number>();
  for (const [id, first] of buildPerExerciseBaseline(filteredWeeks)) {
    const base = baseline.get(id);
    if (base && base > 0) starts.set(id, progressPercent(first, base));
  }
  return starts;
}

function updateRunningProgress(
  runningProgress: Map<string, number>,
  weekExercises: Map<string, number>,
  baseline: Map<string, number>
): void {
  for (const [exId, value] of weekExercises) {
    const baseValue = baseline.get(exId);
    if (baseValue && baseValue > 0) {
      runningProgress.set(exId, progressPercent(value, baseValue));
    }
  }
}

function computePeriodIndexedAverage(
  cohort: Iterable<string>,
  periodStartProgress: Map<string, number>,
  runningProgress: Map<string, number>
): number | null {
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
  return count > 0 ? Math.round((total / count) * 10) / 10 : null;
}

function getRepeatSessionExerciseIds(filteredWeeks: WeekEntry[]): Set<string> {
  const sessionCounts = new Map<string, number>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) {
      sessionCounts.set(exId, (sessionCounts.get(exId) ?? 0) + 1);
    }
  }
  return new Set(
    [...sessionCounts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([exId]) => exId)
  );
}

/** Weekly series indexed to 100 at each exercise's first week in the period. */
export function computeOverallProgressSeries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  formatChartDate: (iso: string) => string
): { week: string; progress: number }[] {
  const periodStartProgress = buildPeriodStartProgress(filteredWeeks, baseline);
  const runningProgress = new Map<string, number>();

  return filteredWeeks.map(([weekStart, exercises]) => {
    updateRunningProgress(runningProgress, exercises, baseline);
    return {
      week: formatChartDate(weekStart),
      progress: computePeriodIndexedAverage(periodStartProgress.keys(), periodStartProgress, runningProgress) ?? 100,
    };
  });
}

const BODY_PART_ORDER: BodyPart[] = [
  "ABS",
  "BACK",
  "BICEPS",
  "CHEST",
  "FOREARMS",
  "GLUTEUS",
  "LEGS",
  "SHOULDERS",
  "TRICEPS",
];

function getExerciseProgressValues(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseId: string
): number[] {
  const baseValue = baseline.get(exerciseId);
  if (!baseValue || baseValue <= 0) return [];

  const values: number[] = [];
  for (const [, exercises] of filteredWeeks) {
    const value = exercises.get(exerciseId);
    if (value !== undefined) {
      values.push(progressPercent(value, baseValue));
    }
  }
  return values;
}

export interface ExerciseProgressSummary {
  exerciseId: string;
  current: number | null;
  change: PeriodChange | null;
}

function summarizeExercises(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseIds: Iterable<string>
): ExerciseProgressSummary[] {
  const summaries: ExerciseProgressSummary[] = [];
  for (const exerciseId of exerciseIds) {
    const values = getExerciseProgressValues(filteredWeeks, baseline, exerciseId);
    if (values.length === 0) continue;
    summaries.push({
      exerciseId,
      current: values[values.length - 1],
      change: computePeriodChange(values),
    });
  }
  return summaries;
}

export function computeExerciseProgressSummaries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  bodyPart: BodyPart
): ExerciseProgressSummary[] {
  const exerciseIds = [...baseline.keys()].filter(
    (exId) => exerciseBodyPart.get(exId) === bodyPart
  );
  return summarizeExercises(filteredWeeks, baseline, exerciseIds).sort(
    (a, b) => (b.current ?? 0) - (a.current ?? 0)
  );
}

/** Weekly body-part lines indexed to 100 at each exercise's first week in the period. */
export function computeBodyPartProgressSeries(
  filteredWeeks: WeekEntry[],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  formatChartDate: (iso: string) => string
): {
  chartData: Record<string, string | number>[];
  bodyParts: BodyPart[];
} {
  const bodyPartCohorts = new Map<BodyPart, string[]>();
  for (const id of getRepeatSessionExerciseIds(filteredWeeks)) {
    const bodyPart = exerciseBodyPart.get(id);
    if (!bodyPart) continue;
    const cohort = bodyPartCohorts.get(bodyPart);
    if (cohort) cohort.push(id);
    else bodyPartCohorts.set(bodyPart, [id]);
  }

  const periodStartProgress = buildPeriodStartProgress(filteredWeeks, baseline);
  const runningProgress = new Map<string, number>();

  const chartData = filteredWeeks.map(([weekStart, exercises]) => {
    const row: Record<string, string | number> = {
      week: formatChartDate(weekStart),
    };

    updateRunningProgress(runningProgress, exercises, baseline);

    for (const [bodyPart, cohort] of bodyPartCohorts) {
      const indexed = computePeriodIndexedAverage(
        cohort,
        periodStartProgress,
        runningProgress
      );
      if (indexed !== null) {
        row[bodyPart] = indexed;
      }
    }

    return row;
  });

  const bodyParts = BODY_PART_ORDER.filter((part) => chartData.some((row) => row[part] !== undefined));
  return { chartData, bodyParts };
}

/** Period change per body-part line (first vs last chart point), like General progress. */
export function computeBodyPartChartChanges(
  chartData: Record<string, string | number>[],
  bodyParts: BodyPart[]
): Map<BodyPart, PeriodChange | null> {
  const changes = new Map<BodyPart, PeriodChange | null>();
  for (const bodyPart of bodyParts) {
    const values = chartData
      .map((row) => row[bodyPart])
      .filter((value): value is number => typeof value === "number");
    changes.set(bodyPart, computePeriodChange(values));
  }
  return changes;
}

export function collectNumericValues(
  chartData: Record<string, string | number>[],
  keys: string[]
): number[] {
  const values: number[] = [];
  for (const row of chartData) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "number") values.push(value);
    }
  }
  return values;
}
