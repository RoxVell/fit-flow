"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie";
import { withoutDeleted } from "@/lib/db/active-records";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { pickLocalized } from "@/lib/exercises/locale";
import { useExerciseManifest } from "@/lib/hooks/use-exercise-library";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  buildCalendar,
  buildExerciseIndex,
  buildExerciseStats,
  buildRhythm,
  buildWeeklySeries,
  computeKpis,
  computeMuscleSplit,
  computeStreaks,
  isFinished,
  type ExerciseIndex,
} from "./analytics";

/** Every completed session, newest first. Desktop views need the full history. */
export function useAllWorkoutLogs(): WorkoutLogEntity[] | undefined {
  return useLiveQuery(async () => {
    const rows = withoutDeleted(await db.workoutLogs.toArray());
    return rows
      .filter(isFinished)
      .sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
  }, []);
}

export function useExerciseIndex(): ExerciseIndex | undefined {
  const locale = useLocale();
  const { manifest } = useExerciseManifest();
  return useMemo(() => {
    if (!manifest) return undefined;
    return buildExerciseIndex(manifest, (item) => pickLocalized(item.name, locale));
  }, [manifest, locale]);
}

export type DesktopAnalytics = ReturnType<typeof buildAnalytics>;

function buildAnalytics(
  logs: WorkoutLogEntity[],
  index: ExerciseIndex,
  windowDays: number
) {
  return {
    kpis: computeKpis(logs, windowDays),
    weekly: buildWeeklySeries(logs, 26),
    muscles: computeMuscleSplit(logs, index, windowDays),
    calendar: buildCalendar(logs, 371),
    streaks: computeStreaks(logs),
    rhythm: buildRhythm(logs),
    exercises: buildExerciseStats(logs, index),
    totalWorkouts: logs.length,
  };
}

export function useDesktopAnalytics(windowDays = 30) {
  const logs = useAllWorkoutLogs();
  const index = useExerciseIndex();

  return useMemo(() => {
    if (!logs || !index) return undefined;
    return buildAnalytics(logs, index, windowDays);
  }, [logs, index, windowDays]);
}
