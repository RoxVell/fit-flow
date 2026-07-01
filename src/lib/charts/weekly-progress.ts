import type { WorkoutLogEntity } from "@/lib/db/types";
import type { BodyPart } from "@/lib/exercises/types";
import { e1RM } from "@/lib/training-metrics";
import { CHART_PERIOD_DAYS, type ChartPeriod } from "./periods";
import { computePeriodChange, type PeriodChange } from "./domain";

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildWeeklyExerciseBest1RM(
  logs: WorkoutLogEntity[]
): Map<string, Map<string, number>> {
  const weeksMap = new Map<string, Map<string, number>>();

  for (const log of logs) {
    if (!log.endedAt) continue;
    const weekStart = getMonday(new Date(log.endedAt)).toISOString();

    if (!weeksMap.has(weekStart)) {
      weeksMap.set(weekStart, new Map());
    }
    const weekExercises = weeksMap.get(weekStart)!;

    for (const ex of log.exercises) {
      const completed = ex.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
      if (completed.length === 0) continue;

      let best1RM = 0;
      for (const set of completed) {
        const estimate = e1RM(set.weight, set.reps);
        if (estimate > best1RM) best1RM = estimate;
      }

      const current = weekExercises.get(ex.exerciseId) || 0;
      if (best1RM > current) {
        weekExercises.set(ex.exerciseId, best1RM);
      }
    }
  }

  return weeksMap;
}

export function getSortedWeeks(
  weeksMap: Map<string, Map<string, number>>
): [string, Map<string, number>][] {
  return [...weeksMap.entries()].sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );
}

export function filterWeeksByPeriod(
  sortedWeeks: [string, Map<string, number>][],
  period: ChartPeriod
): [string, Map<string, number>][] {
  const days = CHART_PERIOD_DAYS[period];
  if (days === Infinity) return sortedWeeks;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sortedWeeks.filter(([weekStart]) => new Date(weekStart) >= cutoff);
}

export function buildPerExerciseBaseline(
  sortedWeeks: [string, Map<string, number>][]
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

function getPeriodCohort(
  filteredWeeks: [string, Map<string, number>][]
): Set<string> {
  const cohort = new Set<string>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) {
      cohort.add(exId);
    }
  }
  return cohort;
}

function getPeriodStartProgress(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  exerciseId: string
): number | null {
  for (const [, exercises] of filteredWeeks) {
    const value = exercises.get(exerciseId);
    const baseValue = baseline.get(exerciseId);
    if (value !== undefined && baseValue && baseValue > 0) {
      return Math.round((value / baseValue) * 1000) / 10;
    }
  }
  return null;
}

function buildPeriodStartProgress(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  cohort: Set<string>
): Map<string, number> {
  const periodStartProgress = new Map<string, number>();
  for (const exId of cohort) {
    const start = getPeriodStartProgress(filteredWeeks, baseline, exId);
    if (start !== null) {
      periodStartProgress.set(exId, start);
    }
  }
  return periodStartProgress;
}

function computePeriodIndexedAverage(
  cohort: Set<string>,
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

function getBodyPartPeriodCohort(
  filteredWeeks: [string, Map<string, number>][],
  exerciseBodyPart: Map<string, BodyPart>,
  bodyPart: BodyPart
): Set<string> {
  const cohort = new Set<string>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) {
      if (exerciseBodyPart.get(exId) === bodyPart) {
        cohort.add(exId);
      }
    }
  }
  return cohort;
}

/** Weekly series indexed to 100 at each exercise's first week in the period. */
export function computeOverallProgressSeries(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  formatChartDate: (iso: string) => string
): { week: string; progress: number }[] {
  const cohort = getPeriodCohort(filteredWeeks);
  const periodStartProgress = buildPeriodStartProgress(filteredWeeks, baseline, cohort);
  const runningProgress = new Map<string, number>();

  return filteredWeeks.map(([weekStart, exercises]) => {
    for (const [exId, value] of exercises) {
      const baseValue = baseline.get(exId);
      if (baseValue && baseValue > 0) {
        runningProgress.set(exId, Math.round((value / baseValue) * 1000) / 10);
      }
    }

    return {
      week: formatChartDate(weekStart),
      progress: computePeriodIndexedAverage(cohort, periodStartProgress, runningProgress) ?? 100,
    };
  });
}

export function computeOverallProgressSummary(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>
): { current: number | null; change: PeriodChange | null } {
  const summaries: ExerciseProgressSummary[] = [];

  for (const exerciseId of baseline.keys()) {
    const values = getExerciseProgressValues(filteredWeeks, baseline, exerciseId);
    if (values.length === 0) continue;
    summaries.push({
      exerciseId,
      current: values[values.length - 1],
      change: computePeriodChange(values),
    });
  }

  return computeBodyPartSummaryFromExercises(summaries);
}

export const BODY_PART_ORDER: BodyPart[] = [
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

function sortBodyParts(bodyParts: BodyPart[]): BodyPart[] {
  return [...bodyParts].sort(
    (a, b) => BODY_PART_ORDER.indexOf(a) - BODY_PART_ORDER.indexOf(b)
  );
}

export function getExercisesForBodyPart(
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  bodyPart: BodyPart
): string[] {
  return [...baseline.keys()].filter(
    (exId) => exerciseBodyPart.get(exId) === bodyPart
  );
}

export function getExerciseProgressValues(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  exerciseId: string
): number[] {
  const baseValue = baseline.get(exerciseId);
  if (!baseValue || baseValue <= 0) return [];

  const values: number[] = [];
  for (const [, exercises] of filteredWeeks) {
    const value = exercises.get(exerciseId);
    if (value !== undefined) {
      values.push(Math.round((value / baseValue) * 1000) / 10);
    }
  }
  return values;
}

export interface ExerciseProgressSummary {
  exerciseId: string;
  current: number | null;
  change: PeriodChange | null;
}

export function computeExerciseProgressSummaries(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  bodyPart: BodyPart
): ExerciseProgressSummary[] {
  const exerciseIds = getExercisesForBodyPart(baseline, exerciseBodyPart, bodyPart);
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

  return summaries.sort((a, b) => (b.current ?? 0) - (a.current ?? 0));
}

/** Weekly body-part lines indexed to 100 at each exercise's first week in the period. */
export function computeBodyPartProgressSeries(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  formatChartDate: (iso: string) => string
): {
  chartData: Record<string, string | number>[];
  bodyParts: BodyPart[];
} {
  const bodyPartsWithData = new Set<BodyPart>();
  for (const [, exercises] of filteredWeeks) {
    for (const exId of exercises.keys()) {
      const bodyPart = exerciseBodyPart.get(exId);
      if (bodyPart) bodyPartsWithData.add(bodyPart);
    }
  }

  const bodyParts = sortBodyParts([...bodyPartsWithData]);
  const bodyPartCohorts = new Map<BodyPart, Set<string>>();
  for (const bodyPart of bodyParts) {
    bodyPartCohorts.set(
      bodyPart,
      getBodyPartPeriodCohort(filteredWeeks, exerciseBodyPart, bodyPart)
    );
  }

  const periodCohort = getPeriodCohort(filteredWeeks);
  const periodStartProgress = buildPeriodStartProgress(filteredWeeks, baseline, periodCohort);
  const runningProgress = new Map<string, number>();

  const chartData = filteredWeeks.map(([weekStart, exercises]) => {
    const row: Record<string, string | number> = {
      week: formatChartDate(weekStart),
    };

    for (const [exId, value] of exercises) {
      const baseValue = baseline.get(exId);
      if (baseValue && baseValue > 0) {
        runningProgress.set(exId, Math.round((value / baseValue) * 1000) / 10);
      }
    }

    for (const bodyPart of bodyParts) {
      const cohort = bodyPartCohorts.get(bodyPart)!;
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

  const activeBodyParts = sortBodyParts(
    bodyParts.filter((bodyPart) =>
      chartData.some((row) => row[bodyPart] !== undefined)
    )
  );

  return { chartData, bodyParts: activeBodyParts };
}

export function computeBodyPartSummaryFromExercises(
  summaries: ExerciseProgressSummary[]
): { current: number | null; change: PeriodChange | null } {
  if (summaries.length === 0) {
    return { current: null, change: null };
  }

  const currents = summaries
    .map((summary) => summary.current)
    .filter((value): value is number => value !== null);
  const current =
    currents.length > 0
      ? Math.round((currents.reduce((sum, value) => sum + value, 0) / currents.length) * 10) /
        10
      : null;

  const relativeChanges = summaries
    .map((summary) => summary.change?.percent)
    .filter((value): value is number => value !== undefined);

  if (relativeChanges.length === 0) {
    return { current, change: null };
  }

  const avgRelative =
    Math.round(
      (relativeChanges.reduce((sum, value) => sum + value, 0) / relativeChanges.length) * 10
    ) / 10;

  return {
    current,
    change: { absolute: avgRelative, percent: avgRelative },
  };
}

export function computeBodyPartSummariesFromExercises(
  filteredWeeks: [string, Map<string, number>][],
  baseline: Map<string, number>,
  exerciseBodyPart: Map<string, BodyPart>,
  bodyParts: BodyPart[]
): Map<BodyPart, { current: number | null; change: PeriodChange | null }> {
  const summaries = new Map<
    BodyPart,
    { current: number | null; change: PeriodChange | null }
  >();

  for (const bodyPart of bodyParts) {
    const exercises = computeExerciseProgressSummaries(
      filteredWeeks,
      baseline,
      exerciseBodyPart,
      bodyPart
    );
    summaries.set(bodyPart, computeBodyPartSummaryFromExercises(exercises));
  }

  return summaries;
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
