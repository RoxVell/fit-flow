"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { isActiveRecord, withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import {
  MUSCLE_GROUPS,
  type MuscleGroup,
  type ProgramEntity,
  type WorkoutLogEntity,
} from "@/lib/db/types";
import {
  bodyPartToMuscleGroup,
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
import type { MuscleWeights } from "@/lib/exercises/types";
import {
  buildDailyBodyViews,
  getWeightTrendFromDailyViews,
} from "@/lib/body-measurements/daily-view";
import { attachExercises } from "@/lib/repositories/exercises";
import { derivePersonalRecords } from "@/lib/workout/personal-records";
import {
  toExerciseDetailedHistorySession,
  toExerciseHistoryPoint,
} from "@/lib/workout/exercise-stats";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { useLocale } from "@/lib/i18n/locale-context";
import { compareByDate } from "@/lib/utils/date";

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
  const { exerciseMap } = useExerciseLookup();
  return useLiveQuery(
    async () => derivePersonalRecords(await db.workoutLogs.toArray(), exerciseMap),
    [exerciseMap]
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
      if (ex.excludeFromStats) continue;
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

export function useWeightSummary() {
  const dailyViews = useDailyBodyViews();
  return useMemo(() => {
    if (!dailyViews) return undefined;
    const summary = getWeightTrendFromDailyViews(dailyViews);
    return { ...summary, hasWeightHistory: summary.currentWeight !== null };
  }, [dailyViews]);
}

export function useWeeklyMuscleLoad() {
  const logs = useLiveQuery(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return db.workoutLogs.where("startedAt").aboveOrEqual(weekAgo.toISOString())
      .filter(isCompletedLog).toArray();
  }, []);
  const { manifest } = useExerciseManifest();

  return useMemo(() => {
    if (!logs || !manifest) return undefined;

    const exerciseRefs = new Map<string, HeatmapExerciseRef>(
      manifest.map((item) => [
        item.id,
        {
          muscleWeights: item.muscleWeights,
          fallbackGroup: bodyPartToMuscleGroup(item.bodyPart),
        },
      ])
    );
    return buildWeeklyHeatmap(logs, exerciseRefs);
  }, [logs, manifest]);
}

async function logsContainingExercise(exerciseId: string): Promise<WorkoutLogEntity[]> {
  return (await db.workoutLogs.filter(isCompletedLog).toArray())
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
