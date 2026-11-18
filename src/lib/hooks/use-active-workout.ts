"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore } from "@/lib/store/workout-store";
import {
  useSessionProgram,
  useWorkoutDraft,
  useCompletedWorkoutLogs,
} from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { derivePersonalRecords } from "@/lib/workout/personal-records";
import { db } from "@/lib/db/dexie";
import { finishWorkout } from "@/lib/repositories/workouts";
import { clearDraft, elapsedWorkoutSeconds, toggleDraftPause, updateDraftExercises } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/id";
import { volume } from "@/lib/training-metrics";
import { newWorkingSet } from "@/lib/workout/start-session-draft";
import { resolveRestDuration } from "@/lib/workout/rest-duration";
import { buildPreviousSetsMap } from "@/lib/workout/previous-sets";
import type {
  LoggedExercise,
  LoggedSet,
  PersonalRecord,
} from "@/lib/db/types";

export function updateLoggedSet(
  exercise: LoggedExercise,
  setIndex: number,
  data: Partial<LoggedSet>,
  options?: { propagateWeight?: boolean }
): LoggedExercise {
  const currentSet = exercise.sets[setIndex];
  if (!currentSet) return exercise;

  const newWeight = data.weight ?? currentSet.weight;
  const shouldPropagateWeight =
    options?.propagateWeight && data.weight !== undefined;

  return {
    ...exercise,
    sets: exercise.sets.map((set, index) => {
      if (index === setIndex) return { ...set, ...data };
      if (shouldPropagateWeight && index > setIndex && !set.completed) {
        return { ...set, weight: newWeight };
      }
      return set;
    }),
  };
}

const EMPTY_EXERCISES: LoggedExercise[] = [];

export function useActiveWorkout(
  sessionId: string | undefined
) {
  const router = useRouter();
  const restStore = useWorkoutStore();
  const draft = useWorkoutDraft();
  const { exerciseMap } = useExerciseLookup();
  const draftSessionId = draft?.sessionId ?? sessionId;
  const program = useSessionProgram(draftSessionId);
  const workoutLogs = useCompletedWorkoutLogs(50);
  const restDurationSeconds = resolveRestDuration(program?.restDurationSeconds);

  const exercises = draft?.exercises ?? EMPTY_EXERCISES;
  const activeWorkoutId = draft?.activeWorkoutId ?? null;

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTriumph, setShowTriumph] = useState(false);
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);
  const [previousRecords, setPreviousRecords] = useState<PersonalRecord[]>([]);
  const [triumphData, setTriumphData] = useState<{
    volume: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [lastActiveExerciseId, setLastActiveExerciseId] = useState<string | null>(null);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const hasFinishedRef = useRef(false);

  const nowSec = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 1000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0
  );

  const elapsed = elapsedWorkoutSeconds(draft, nowSec);

  useEffect(() => {
    if (draft === undefined) return;
    if (hasFinishedRef.current || showTriumph || isAbandoning) return;
    if (draft?.activeWorkoutId) return;
    router.replace("/workout");
  }, [draft, router, showTriumph, isAbandoning]);

  const previousSetsMap = useMemo(() => {
    return buildPreviousSetsMap(exercises, workoutLogs ?? []);
  }, [workoutLogs, exercises]);

  const totalVolume = useMemo(
    () => volume(exercises.flatMap((e) => e.sets.filter((s) => s.completed))),
    [exercises]
  );

  const completedSetsCount = useMemo(
    () => exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0),
    [exercises]
  );

  const totalSetsCount = useMemo(
    () => exercises.reduce((sum, e) => sum + e.sets.length, 0),
    [exercises]
  );

  const activeExerciseId = useMemo(() => {
    const lastEx = lastActiveExerciseId
      ? exercises.find((e) => e.id === lastActiveExerciseId)
      : null;
    if (lastEx && lastEx.sets.some((s) => !s.completed)) return lastEx.id;
    return (
      exercises.find((ex) => ex.sets.some((s) => !s.completed))?.id ||
      exercises[exercises.length - 1]?.id
    );
  }, [lastActiveExerciseId, exercises]);

  const incompleteExists = completedSetsCount < totalSetsCount;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const session = program?.sessions.find((s) => s.id === draftSessionId);
    const completedAt = new Date().toISOString();

    void (async () => {
      try {
        if (!activeWorkoutId) throw new Error("Workout draft no longer available");
        const history = await db.workoutLogs.toArray();
        const createdLog = await finishWorkout(activeWorkoutId, {
          endedAt: completedAt,
          programId: program?.id,
          programName: program?.name,
          sessionName: session?.name,
        });
        const previousLogs = history.filter((log) => log.id !== createdLog.id);
        const records = derivePersonalRecords([...previousLogs, createdLog], exerciseMap);
        setPreviousRecords(records.filter((record) => record.workoutLogId !== createdLog.id));
        setNewRecords(records.filter((record) => record.workoutLogId === createdLog.id));
        restStore.stopRestTimer();
        setTriumphData({
          volume: volume(createdLog.exercises.flatMap((exercise) => exercise.sets.filter((set) => set.completed))),
          minutes, seconds,
        });
        setShowTriumph(true);
      } catch (err) {
        console.warn("[finishWorkout] save failed", err);
        hasFinishedRef.current = false;
      }
    })();
  };

  const handleFinish = () => {
    if (incompleteExists || completedSetsCount === 0) {
      setShowConfirmFinish(true);
      return;
    }
    finish();
  };

  const confirmFinish = () => {
    setShowConfirmFinish(false);
    if (completedSetsCount === 0) return;
    finish();
  };

  const handleCloseTriumph = () => {
    setShowTriumph(false);
    router.replace("/dashboard");
  };

  const abandonWorkout = async () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsAbandoning(true);
    try {
      await clearDraft(activeWorkoutId);
      restStore.stopRestTimer();
      router.replace("/workout");
    } catch (err) {
      console.warn("[abandonWorkout] clearDraft failed", err);
      hasFinishedRef.current = false;
      setIsAbandoning(false);
    }
  };

  const editExercise = (id: string, change: (entry: LoggedExercise) => LoggedExercise) =>
    updateDraftExercises(activeWorkoutId, (current) => current.map((entry) =>
      entry.id === id ? change(entry) : entry
    ));

  const toggleSetCompleted = (exerciseId: string, setIndex: number) => {
    const before = exercises.find((e) => e.id === exerciseId)?.sets[setIndex];
    if (!before) return;
    const willComplete = !before.completed;
    if (willComplete && (before.weight <= 0 || before.reps <= 0)) return;

    void editExercise(exerciseId, (entry) => updateLoggedSet(entry, setIndex, { completed: willComplete }));
    if (willComplete) {
      restStore.startRestTimer(restDurationSeconds);
      setLastActiveExerciseId(exerciseId);
    }
  };

  const addExercise = (exerciseId: string) => {
    void updateDraftExercises(activeWorkoutId, (current) => {
      const id = generateId();
      return [
        ...current,
        {
          id,
          exerciseId,
          workoutLogId: activeWorkoutId ?? id,
          sortOrder: current.length,
          sets: [newWorkingSet(id, 0)],
        },
      ];
    });
  };

  const removeExercise = (loggedExerciseId: string) => {
    void updateDraftExercises(activeWorkoutId, (current) =>
      current
        .filter((e) => e.id !== loggedExerciseId)
        .map((e, i) => ({ ...e, sortOrder: i }))
    );
  };

  const addSet = (loggedExerciseId: string) => {
    void editExercise(loggedExerciseId, (entry) => {
      const last = entry.sets.at(-1);
      const set = newWorkingSet(entry.id, (last?.setOrder ?? -1) + 1);
      set.reps = last?.reps || 10;
      set.weight = last?.weight ?? 0;
      return { ...entry, sets: [...entry.sets, set] };
    });
  };

  const removeSet = (id: string, setIndex: number) => {
    void editExercise(id, (entry) => ({
      ...entry, sets: entry.sets.filter((_, i) => i !== setIndex).map((set, i) => ({ ...set, setOrder: i })),
    }));
  };

  const updateSet = (id: string, setIndex: number, data: Partial<LoggedSet>, options?: { propagateWeight?: boolean }) => {
    void editExercise(id, (entry) => updateLoggedSet(entry, setIndex, data, options));
  };

  const updateExercise = (id: string, data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>) => {
    void editExercise(id, (entry) => ({ ...entry, ...data }));
  };

  const swapExercise = async (loggedExerciseId: string, newExerciseId: string) => {
    const original = exercises.find((e) => e.id === loggedExerciseId);
    if (!original || original.exerciseId === newExerciseId) return;
    const updated = await editExercise(loggedExerciseId, (entry) => ({
      ...entry,
      exerciseId: newExerciseId,
      exercise: undefined,
      notes: undefined,
      excludeFromStats: undefined,
      sets: entry.sets.map((set) => ({ ...set, id: generateId(), weight: 0, reps: 0, completed: false })),
    }));
    if (!updated) return;
    await db.exerciseReplacements.put({
      fromExerciseId: original.exerciseId,
      toExerciseId: newExerciseId,
      lastUsedAt: new Date().toISOString(),
    });
  };

  return {
    exerciseMap,
    previousSetsMap,
    activeExerciseId,
    activeWorkoutId,
    exercises,
    elapsed,
    minutes,
    seconds,
    isPaused: draft?.pausedAt !== undefined,
    togglePause: () => void toggleDraftPause(activeWorkoutId, Math.floor(Date.now() / 1000)),
    completedSetsCount,
    totalSetsCount,
    totalVolume,
    handleFinish,
    confirmFinish,
    showConfirmFinish,
    setShowConfirmFinish,
    abandonWorkout,
    showTriumph,
    isAbandoning,
    newRecords,
    previousRecords,
    programId: program?.id,
    triumphData,
    handleCloseTriumph,
    toggleSetCompleted,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    swapExercise,
    updateExercise,
  };
}
