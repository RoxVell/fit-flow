import { useMemo, useRef, useState } from "react";

import { Vibration } from "react-native";

import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import type { LoggedExercise, LoggedSet, PersonalRecord, WorkoutProgram } from "@/lib/db/types";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale } from "@/lib/i18n/locale-context";
import { clearDraft, updateDraftExercises } from "@/lib/repositories/drafts";
import { listPersonalRecords, createPRsFromWorkout, createPersonalRecord } from "@/lib/repositories/records";
import { createWorkoutLog, listCompletedWorkoutLogs } from "@/lib/repositories/workouts";
import { volume } from "@/lib/training-metrics";

import { formatElapsedClock } from "./format";
import { buildPreviousSetsMap } from "./previous-sets";
import { resolveRestDuration } from "./rest-duration";
import {
  addSet,
  appendExercise,
  mapExercise,
  removeExercise,
  removeSet,
  swapExercise,
  toggleSetCompleted,
  updateLoggedSet,
} from "./session";
import { useActiveWorkout } from "./use-active-workout";
import { useElapsedSeconds } from "./use-elapsed";
import { useRestTimer } from "./use-rest-timer";

export type TriumphState = {
  volume: number;
  elapsedLabel: string;
  records: Omit<PersonalRecord, "id">[];
};

export function useWorkoutSession(program: WorkoutProgram | undefined) {
  const { locale } = useLocale();
  const { isActive, draft } = useActiveWorkout();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(50), [TABLES.workoutLogs]);
  const restTimer = useRestTimer();
  const restDuration = resolveRestDuration(program?.restDurationSeconds);

  const [isPaused, setIsPaused] = useState(false);
  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(null);
  const [triumph, setTriumph] = useState<TriumphState | null>(null);
  const [lastActiveExerciseId, setLastActiveExerciseId] = useState<string | null>(null);
  const finishing = useRef(false);

  const wallElapsed = useElapsedSeconds(draft.startedAt);
  const elapsed = frozenElapsed ?? wallElapsed;

  const exercises = draft.exercises;
  const previousSetsMap = useMemo(() => buildPreviousSetsMap(exercises, logs), [exercises, logs]);

  const completedSets = exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const totalVolume = volume(exercises.flatMap((ex) => ex.sets.filter((s) => s.completed)));

  const activeExerciseId = useMemo(() => {
    const last = lastActiveExerciseId ? exercises.find((ex) => ex.id === lastActiveExerciseId) : undefined;
    if (last?.sets.some((set) => !set.completed)) return last.id;
    return exercises.find((ex) => ex.sets.some((set) => !set.completed))?.id ?? exercises.at(-1)?.id;
  }, [exercises, lastActiveExerciseId]);

  const patch = (updater: (current: LoggedExercise[]) => LoggedExercise[]) => {
    updateDraftExercises(updater);
  };

  const togglePause = () => {
    setIsPaused((paused) => {
      if (!paused) {
        setFrozenElapsed(wallElapsed);
        return true;
      }
      setFrozenElapsed(null);
      return false;
    });
  };

  const onToggleSet = (loggedExerciseId: string, setIndex: number) => {
    const before = exercises.find((ex) => ex.id === loggedExerciseId)?.sets[setIndex];
    if (!before) return;
    const willComplete = !before.completed;
    if (willComplete && (before.weight === 0 || before.reps === 0)) return;
    patch((current) => mapExercise(current, loggedExerciseId, (ex) => toggleSetCompleted(ex, setIndex)));
    if (willComplete) {
      setLastActiveExerciseId(loggedExerciseId);
      Vibration.vibrate(10);
      restTimer.start(restDuration);
    }
  };

  const onUpdateSet = (
    loggedExerciseId: string,
    setIndex: number,
    data: Partial<LoggedSet>,
    options?: { propagateWeight?: boolean },
  ) => {
    patch((current) => mapExercise(current, loggedExerciseId, (ex) => updateLoggedSet(ex, setIndex, data, options)));
  };

  const onAddSet = (loggedExerciseId: string) => {
    patch((current) => mapExercise(current, loggedExerciseId, addSet));
  };

  const onRemoveSet = (loggedExerciseId: string, setIndex: number) => {
    patch((current) => mapExercise(current, loggedExerciseId, (ex) => removeSet(ex, setIndex)));
  };

  const onAddExercise = (exerciseId: string) => {
    patch((current) => appendExercise(current, exerciseId, draft.activeWorkoutId ?? exerciseId));
  };

  const onRemoveExercise = (loggedExerciseId: string) => {
    patch((current) => removeExercise(current, loggedExerciseId));
  };

  const onSwapExercise = (loggedExerciseId: string, newExerciseId: string) => {
    patch((current) => mapExercise(current, loggedExerciseId, (ex) => swapExercise(ex, newExerciseId)));
  };

  const onUpdateExercise = (
    loggedExerciseId: string,
    data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>,
  ) => {
    patch((current) => mapExercise(current, loggedExerciseId, (ex) => ({ ...ex, ...data })));
  };

  const persistFinish = (sessionName: string | undefined) => {
    if (finishing.current || completedSets === 0) return;
    finishing.current = true;
    restTimer.stop();
    const completedAt = new Date().toISOString();
    const capturedVolume = totalVolume;
    const capturedElapsed = formatElapsedClock(elapsed);

    try {
      const log = createWorkoutLog({
        startedAt: draft.startedAt ?? completedAt,
        endedAt: completedAt,
        programId: program?.id,
        sessionId: draft.sessionId ?? undefined,
        programName: program?.name,
        sessionName,
        exercises,
      });
      const records = createPRsFromWorkout(
        exercises,
        (id) => getExerciseName(id, locale, "") || undefined,
        completedAt,
        listPersonalRecords(),
      );
      for (const record of records) {
        createPersonalRecord({ ...record, workoutLogId: log.id });
      }
      clearDraft();
      setTriumph({ volume: capturedVolume, elapsedLabel: capturedElapsed, records });
    } catch (err) {
      console.warn("[finishWorkout] failed", err);
      finishing.current = false;
    }
  };

  const abandon = () => {
    if (finishing.current) return;
    finishing.current = true;
    restTimer.stop();
    clearDraft();
  };

  return {
    isActive,
    draft,
    exercises,
    previousSetsMap,
    elapsed,
    isPaused,
    togglePause,
    completedSets,
    totalSets,
    totalVolume,
    restTimer,
    restDuration,
    triumph,
    activeExerciseId,
    onToggleSet,
    onUpdateSet,
    onAddSet,
    onRemoveSet,
    onAddExercise,
    onRemoveExercise,
    onSwapExercise,
    onUpdateExercise,
    persistFinish,
    abandon,
  };
}
