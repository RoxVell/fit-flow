"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { isActiveRecord, withoutDeleted } from "@/lib/db/active-records";
import { db } from "@/lib/db/dexie";
import type {
  DashboardStats,
  Exercise,
  ExerciseFilters,
  MuscleGroup,
} from "@/lib/db/types";
import {
  bodyPartToMuscleGroup,
  buildExerciseMapFromManifest,
  manifestToExercise,
} from "@/lib/exercises/adapter";
import {
  matchesUnilateralFilter,
  toLibraryFilters,
} from "@/lib/exercises/legacy-filters";
import { attachExercisesToSessions } from "@/lib/repositories/exercises";
import { bestE1RM, bestWeight, volume } from "@/lib/training-metrics";
import {
  useExerciseLibrary,
  useExerciseManifest,
} from "@/lib/hooks/use-exercise-library";
import { useLocale } from "@/lib/stores/locale-store";

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

export function usePrograms() {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  return useLiveQuery(async () => {
    const raw = withoutDeleted(await db.programs.toArray());
    if (!manifest) return undefined;
    const map = buildExerciseMapFromManifest(manifest, locale);
    return raw.map((p) => ({
      ...p,
      sessions: attachExercisesToSessions(p.sessions, map),
    }));
  }, [locale, manifest]);
}

export function useActiveProgram() {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  return useLiveQuery(async () => {
    const active = await db.programs.filter((p) => p.isActive && !p.deletedAt).first();
    if (!active) return null;
    if (!manifest) return null;
    const map = buildExerciseMapFromManifest(manifest, locale);
    return {
      ...active,
      sessions: attachExercisesToSessions(active.sessions, map),
    };
  }, [locale, manifest]);
}

export function useProgram(id: string) {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  return useLiveQuery(async () => {
    const program = await db.programs.get(id);
    if (!isActiveRecord(program)) return null;
    if (!manifest) return undefined;
    const map = buildExerciseMapFromManifest(manifest, locale);
    return {
      ...program,
      sessions: attachExercisesToSessions(program.sessions, map),
    };
  }, [id, locale, manifest]);
}

export function useWorkoutLogs(limit = 20) {
  return useLiveQuery(
    () =>
      db.workoutLogs
        .orderBy("startedAt")
        .reverse()
        .filter((l) => !l.deletedAt)
        .limit(limit)
        .toArray(),
    [limit]
  );
}

export function useWorkoutLog(id: string) {
  return useLiveQuery(async () => {
    const log = await db.workoutLogs.get(id);
    return isActiveRecord(log) ? log : null;
  }, [id]);
}

export function useBodyMeasurements() {
  return useLiveQuery(async () => {
    return withoutDeleted(await db.bodyMeasurements.toArray()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, []);
}

export function usePersonalRecords() {
  return useLiveQuery(
    () => db.personalRecords.filter((r) => !r.deletedAt).toArray(),
    []
  );
}

export function useCardioSessions() {
  return useLiveQuery(async () => {
    return withoutDeleted(await db.cardioSessions.toArray()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);
}

export function useWorkoutDraft() {
  return useLiveQuery(async () => (await db.workoutDrafts.get("active")) ?? null, []);
}

export function useDashboardStats(): DashboardStats | undefined {
  const logs = useWorkoutLogs(100);
  const measurements = useBodyMeasurements();
  const programs = usePrograms();
  const { manifest } = useExerciseManifest();

  return useMemo(() => {
    if (!logs || !measurements || !programs || !manifest) return undefined;

    const exerciseMap = new Map(
      manifest.map((item) => [
        item.id,
        { muscleGroup: bodyPartToMuscleGroup(item.bodyPart), secondaryMuscles: [] as MuscleGroup[] },
      ])
    );
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = logs.filter((l) => new Date(l.startedAt) >= weekAgo);

    const weeklyVolume = thisWeek.reduce(
      (sum, l) => sum + l.exercises.reduce((es, e) => es + volume(e.sets), 0),
      0
    );

    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const lastTwo = sortedMeasurements.slice(-2);
    const currentWeight = lastTwo[lastTwo.length - 1]?.weight ?? 0;
    const prevWeight = lastTwo[0]?.weight;
    const weightTrend: DashboardStats["weightTrend"] =
      prevWeight === undefined
        ? "stable"
        : currentWeight > prevWeight
          ? "up"
          : currentWeight < prevWeight
            ? "down"
            : "stable";

    const activeProgram = programs.find((p) => p.isActive);
    const today = new Date().getDay();
    const nextSession =
      activeProgram?.sessions.find((s) => s.dayOfWeek === today) ??
      activeProgram?.sessions[0];

    const heatmapData: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      forearms: 0,
      quads: 0,
      hamstrings: 0,
      glutes: 0,
      calves: 0,
      abs: 0,
      traps: 0,
      hip_flexors: 0,
      full_body: 0,
    };

    for (const log of thisWeek) {
      for (const ex of log.exercises) {
        const ref = exerciseMap.get(ex.exerciseId);
        if (!ref) continue;
        const completed = ex.sets.filter((s) => s.completed).length;
        if (completed > 0) {
          heatmapData[ref.muscleGroup] += completed;
          for (const sec of ref.secondaryMuscles) {
            heatmapData[sec] += completed;
          }
        }
      }
    }

    const activeDays = new Set(
      thisWeek.map((l) => new Date(l.startedAt).toDateString())
    ).size;

    return {
      weeklyWorkouts: thisWeek.length,
      weeklyVolume,
      currentWeight,
      weightTrend,
      steps: 8432,
      calories: 345,
      activeDays,
      nextSession,
      heatmapData,
    };
  }, [logs, measurements, programs, manifest]);
}

export function useExerciseHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const logs = withoutDeleted(await db.workoutLogs.toArray())
      .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    return logs.map((l) => {
      const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
      const completed = ex.sets.filter((s) => s.completed);
      return {
        date: l.startedAt,
        volume: volume(completed),
        maxWeight: bestWeight(completed),
        estimated1RM: bestE1RM(completed),
      };
    });
  }, [exerciseId]);
}

export function useExerciseDetailedHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const logs = withoutDeleted(await db.workoutLogs.toArray())
      .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    return logs.map((l) => {
      const ex = l.exercises.find((e) => e.exerciseId === exerciseId)!;
      const completed = ex.sets.filter((s) => s.completed);
      return {
        date: l.startedAt,
        bestE1RM: bestE1RM(completed),
        sets: completed.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          type: s.type,
          setOrder: s.setOrder,
        })),
      };
    });
  }, [exerciseId]);
}
