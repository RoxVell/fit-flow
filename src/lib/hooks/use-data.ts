"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie";
import { ensureSeeded } from "@/lib/db/seed-loader";
import type {
  DashboardStats,
  ExerciseFilters,
  MuscleGroup,
} from "@/lib/db/types";
import {
  attachExercisesToSessions,
  filterExercises,
} from "@/lib/repositories/exercises";
import type { ProgramEntity } from "@/lib/db/types";
import { volume } from "@/lib/training-metrics";

function useEnsureSeed() {
  useLiveQuery(async () => {
    await ensureSeeded();
    return true;
  }, []);
}

export function useExercises(filters?: ExerciseFilters) {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const all = await db.exercises.toArray();
    return filterExercises(all, filters);
  }, [
    filters?.muscleGroup,
    filters?.equipment,
    filters?.category,
    filters?.unilateral,
    filters?.search,
  ]);
}

export function useExercise(id: string) {
  useEnsureSeed();
  return useLiveQuery(() => db.exercises.get(id), [id]);
}

async function attachPrograms(programs: ProgramEntity[]) {
  const exercises = await db.exercises.toArray();
  const map = new Map(exercises.map((e) => [e.id, e]));
  return programs.map((p) => ({
    ...p,
    sessions: attachExercisesToSessions(p.sessions, map),
  }));
}

export function usePrograms() {
  useEnsureSeed();
  return useLiveQuery(async () => attachPrograms(await db.programs.toArray()), []);
}

export function useActiveProgram() {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const active = await db.programs.filter((p) => p.isActive).first();
    if (!active) return undefined;
    const [program] = await attachPrograms([active]);
    return program;
  }, []);
}

export function useProgram(id: string) {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const program = await db.programs.get(id);
    if (!program) return undefined;
    const [attached] = await attachPrograms([program]);
    return attached;
  }, [id]);
}

export function useWorkoutLogs(limit = 20) {
  useEnsureSeed();
  return useLiveQuery(
    () => db.workoutLogs.orderBy("startedAt").reverse().limit(limit).toArray(),
    [limit]
  );
}

export function useWorkoutLog(id: string) {
  useEnsureSeed();
  return useLiveQuery(() => db.workoutLogs.get(id), [id]);
}

export function useBodyMeasurements() {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const all = await db.bodyMeasurements.toArray();
    return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);
}

export function usePersonalRecords() {
  useEnsureSeed();
  return useLiveQuery(() => db.personalRecords.toArray(), []);
}

export function useCardioSessions() {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const all = await db.cardioSessions.toArray();
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);
}

export function useWorkoutDraft() {
  return useLiveQuery(() => db.workoutDrafts.get("active"), []);
}

export function useDashboardStats(): DashboardStats | undefined {
  const logs = useWorkoutLogs(100);
  const measurements = useBodyMeasurements();
  const programs = usePrograms();
  const exercises = useExercises();

  return useMemo(() => {
    if (!logs || !measurements || !programs || !exercises) return undefined;

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
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
  }, [logs, measurements, programs, exercises]);
}

export function useExerciseHistory(exerciseId: string) {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const { getExerciseHistory } = await import("@/lib/repositories/workouts");
    return getExerciseHistory(exerciseId);
  }, [exerciseId]);
}

export function useExerciseDetailedHistory(exerciseId: string) {
  useEnsureSeed();
  return useLiveQuery(async () => {
    const { getExerciseDetailedHistory } = await import("@/lib/repositories/workouts");
    return getExerciseDetailedHistory(exerciseId);
  }, [exerciseId]);
}
