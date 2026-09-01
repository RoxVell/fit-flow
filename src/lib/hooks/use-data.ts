"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { isActiveRecord, withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import {
  MUSCLE_GROUPS,
  type DashboardStats,
  type Exercise,
  type ExerciseFilters,
  type MuscleGroup,
  type ProgramEntity,
  type WorkoutLogEntity,
} from "@/lib/db/types";
import {
  bodyPartToMuscleGroup,
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
import {
  matchesUnilateralFilter,
  toLibraryFilters,
} from "@/lib/exercises/filter-adapter";
import type { MuscleWeights } from "@/lib/exercises/types";
import {
  buildDailyBodyViews,
  getWeightTrendFromDailyViews,
} from "@/lib/body-measurements/daily-view";
import { attachExercises } from "@/lib/repositories/exercises";
import { volume } from "@/lib/training-metrics";
import {
  toExerciseDetailedHistorySession,
  toExerciseHistoryPoint,
} from "@/lib/workout/exercise-stats";
import {
  useExerciseLibrary,
  useExerciseManifest,
} from "@/lib/hooks/use-exercise-library";
import { useLocale } from "@/lib/i18n/locale-context";
import { compareByDate } from "@/lib/utils/date";

export function useExercises(filters?: ExerciseFilters): Exercise[] | undefined {
  const locale = useLocale();
  const { manifest, loading: manifestLoading } = useExerciseManifest();
  const libraryFilters = useMemo(
    () => toLibraryFilters(filters),
    [
      filters?.muscleGroup,
      filters?.equipment,
      filters?.category,
      filters?.search,
    ]
  );
  const { exercises: manifestItems, loading: filterLoading } =
    useExerciseLibrary(libraryFilters);

  return useMemo(() => {
    if (manifestLoading || filterLoading || !manifest || !manifestItems) {
      return undefined;
    }
    let result = manifestItems.map((item) => manifestToExercise(item, locale));
    if (filters?.unilateral !== undefined) {
      result = result.filter((e) =>
        matchesUnilateralFilter(
          e.unilateral ? "UNILATERAL" : "BILATERAL",
          filters.unilateral
        )
      );
    }
    return result;
  }, [manifestItems, manifestLoading, filterLoading, manifest, locale, filters?.unilateral]);
}

export function useExercise(id: string) {
  const locale = useLocale();
  const { manifest, loading } = useExerciseManifest();

  return useMemo(() => {
    if (loading || !manifest) return undefined;
    const item = manifest.find((e) => e.id === id);
    return item ? manifestToExercise(item, locale) : null;
  }, [manifest, loading, id, locale]);
}

/** Resolves session exercises against the localized manifest; undefined while it loads. */
function useSessionExerciseAttacher() {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  return useMemo(() => {
    if (!manifest) return undefined;
    const map = buildExerciseMapFromManifest(manifest, locale);
    return (program: ProgramEntity): ProgramEntity => ({
      ...program,
      sessions: attachExercises(program.sessions, map),
    });
  }, [manifest, locale]);
}

export function usePrograms() {
  const attach = useSessionExerciseAttacher();
  return useLiveQuery(async () => {
    const raw = withoutDeleted(await db.programs.toArray());
    return attach ? raw.map(attach) : undefined;
  }, [attach]);
}

export function useActiveProgram() {
  const attach = useSessionExerciseAttacher();
  return useLiveQuery(async () => {
    const active = await db.programs.filter((p) => p.isActive && !p.deletedAt).first();
    if (!active) return null;
    return attach ? attach(active) : undefined;
  }, [attach]);
}

export function useProgram(id: string) {
  const attach = useSessionExerciseAttacher();
  return useLiveQuery(async () => {
    const program = await db.programs.get(id);
    if (!isActiveRecord(program)) return null;
    return attach ? attach(program) : undefined;
  }, [id, attach]);
}

function isCompletedLog(log: WorkoutLogEntity): boolean {
  return !log.deletedAt && !!log.endedAt;
}

function recentLogs(limit: number, predicate: (log: WorkoutLogEntity) => boolean) {
  return db.workoutLogs
    .orderBy("startedAt")
    .reverse()
    .filter(predicate)
    .limit(limit)
    .toArray();
}

export function useWorkoutLogs(limit = 20) {
  return useLiveQuery(() => recentLogs(limit, isActiveRecord), [limit]);
}

export function useCompletedWorkoutLogs(limit: number) {
  return useLiveQuery(() => recentLogs(limit, isCompletedLog), [limit]);
}

export function useCompletedWorkoutLogsCount() {
  return useLiveQuery(() => db.workoutLogs.filter(isCompletedLog).count(), []);
}

export function useBodyMeasurements() {
  return useLiveQuery(async () => {
    return withoutDeleted(await db.bodyMeasurements.toArray()).sort((a, b) =>
      compareByDate(a.date, b.date)
    );
  }, []);
}

export function useDailyBodyViews() {
  const measurements = useBodyMeasurements();
  return useMemo(() => {
    if (!measurements) return undefined;
    return buildDailyBodyViews(measurements);
  }, [measurements]);
}

export function usePersonalRecords() {
  return useLiveQuery(
    () => db.personalRecords.filter((r) => !r.deletedAt).toArray(),
    []
  );
}

export function useCardioSessions() {
  return useLiveQuery(async () => {
    return withoutDeleted(await db.cardioSessions.toArray()).sort((a, b) =>
      compareByDate(b.date, a.date)
    );
  }, []);
}

export function useWorkoutDraft() {
  return useLiveQuery(async () => (await db.workoutDrafts.get("active")) ?? null, []);
}

type HeatmapExerciseRef = {
  muscleWeights?: MuscleWeights;
  fallbackGroup: MuscleGroup;
};

/** Sums completed sets per muscle group, weighted by the exercise's muscle split. */
function buildWeeklyHeatmap(
  logs: WorkoutLogEntity[],
  refs: Map<string, HeatmapExerciseRef>
): Record<MuscleGroup, number> {
  const heatmap = Object.fromEntries(
    MUSCLE_GROUPS.map((group) => [group, 0])
  ) as Record<MuscleGroup, number>;

  for (const log of logs) {
    for (const ex of log.exercises) {
      const ref = refs.get(ex.exerciseId);
      if (!ref) continue;
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const weights = ref.muscleWeights;
      if (weights && Object.keys(weights).length > 0) {
        for (const [group, percent] of Object.entries(weights)) {
          heatmap[group as MuscleGroup] += ((percent ?? 0) / 100) * completedSets.length;
        }
      } else {
        heatmap[ref.fallbackGroup] += completedSets.length;
      }
    }
  }

  return heatmap;
}

export function useDashboardStats(): DashboardStats | undefined {
  const logs = useWorkoutLogs(100);
  const measurements = useBodyMeasurements();
  const programs = usePrograms();
  const { manifest } = useExerciseManifest();

  return useMemo(() => {
    if (!logs || !measurements || !programs || !manifest) return undefined;

    const exerciseRefs = new Map<string, HeatmapExerciseRef>(
      manifest.map((item) => [
        item.id,
        {
          muscleWeights: item.muscleWeights,
          fallbackGroup: bodyPartToMuscleGroup(item.bodyPart),
        },
      ])
    );
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = logs.filter((l) => new Date(l.startedAt) >= weekAgo);

    const weeklyVolume = thisWeek.reduce(
      (sum, l) => sum + l.exercises.reduce((es, e) => es + volume(e.sets), 0),
      0
    );

    const dailyViews = buildDailyBodyViews(measurements);
    const { currentWeight, weightTrend } = getWeightTrendFromDailyViews(dailyViews);
    const hasWeightHistory = dailyViews.some((view) => view.weight != null);

    const activeProgram = programs.find((p) => p.isActive);
    const today = new Date().getDay();
    const nextSession =
      activeProgram?.sessions.find((s) => s.dayOfWeek === today) ??
      activeProgram?.sessions[0];

    const activeDays = new Set(
      thisWeek.map((l) => new Date(l.startedAt).toDateString())
    ).size;

    return {
      weeklyWorkouts: thisWeek.length,
      weeklyVolume,
      currentWeight,
      weightTrend,
      hasWeightHistory,
      activeDays,
      nextSession,
      heatmapData: buildWeeklyHeatmap(thisWeek, exerciseRefs),
    };
  }, [logs, measurements, programs, manifest]);
}

async function logsContainingExercise(exerciseId: string): Promise<WorkoutLogEntity[]> {
  return withoutDeleted(await db.workoutLogs.toArray())
    .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => compareByDate(a.startedAt, b.startedAt));
}

export function useExerciseHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const logs = await logsContainingExercise(exerciseId);
    return logs
      .map((l) => toExerciseHistoryPoint(l, exerciseId))
      .filter((point): point is NonNullable<typeof point> => point !== null);
  }, [exerciseId]);
}

export function useExerciseDetailedHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const logs = await logsContainingExercise(exerciseId);
    return logs
      .map((l) => toExerciseDetailedHistorySession(l, exerciseId))
      .filter((session): session is NonNullable<typeof session> => session !== null);
  }, [exerciseId]);
}
