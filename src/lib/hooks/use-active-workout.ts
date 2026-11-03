"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore } from "@/lib/store/workout-store";
import {
  useActiveProgram,
  useWorkoutDraft,
  useWorkoutLogs,
} from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { derivePersonalRecords } from "@/lib/workout/personal-records";
import { db } from "@/lib/db/dexie";
import { finishWorkout } from "@/lib/repositories/workouts";
import { clearDraft, updateDraftExercises } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/id";
import { volume } from "@/lib/training-metrics";
import { resolveRestDuration } from "@/lib/workout/rest-duration";
import { buildPreviousSetsMap } from "@/lib/workout/previous-sets";
import type {
  Exercise,
  LoggedExercise,
  LoggedSet,
  PersonalRecord,
} from "@/lib/db/types";

export interface UseActiveWorkoutResult {
  exerciseMap: Map<string, Exercise>;
  previousSetsMap: Map<string, ({ weight: number; reps: number } | null)[]>;
  activeExerciseId: string | undefined;
  activeWorkoutId: string | null;
  exercises: LoggedExercise[];
  elapsed: number;
  minutes: number;
  seconds: number;
  isPaused: boolean;
  togglePause: () => void;
  completedSetsCount: number;
  totalSetsCount: number;
  totalVolume: number;
  handleFinish: () => void;
  confirmFinish: () => void;
  showConfirmFinish: boolean;
  setShowConfirmFinish: (b: boolean) => void;
  abandonWorkout: () => Promise<void>;
  showTriumph: boolean;
  isAbandoning: boolean;
  newRecords: PersonalRecord[];
  previousRecords: PersonalRecord[];
  programId: string | undefined;
  triumphData: { volume: number; minutes: number; seconds: number } | null;
  handleCloseTriumph: () => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (loggedExerciseId: string) => void;
  addSet: (loggedExerciseId: string) => void;
  removeSet: (loggedExerciseId: string, setIndex: number) => void;
  updateSet: (
    loggedExerciseId: string,
    setIndex: number,
    data: Partial<LoggedSet>,
    options?: { propagateWeight?: boolean; baselineWeight?: number }
  ) => void;
  swapExercise: (loggedExerciseId: string, newExerciseId: string) => Promise<void>;
  updateExercise: (
    loggedExerciseId: string,
    data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>
  ) => void;
}

export function updateLoggedSet(
  exercise: LoggedExercise,
  setIndex: number,
  data: Partial<LoggedSet>,
  options?: { propagateWeight?: boolean; baselineWeight?: number }
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
): UseActiveWorkoutResult {
  const router = useRouter();
  const restStore = useWorkoutStore();
  const draft = useWorkoutDraft();
  const { exerciseMap } = useExerciseLookup();
  const program = useActiveProgram();
  const workoutLogs = useWorkoutLogs(50);
  const restDurationSeconds = resolveRestDuration(program?.restDurationSeconds);

  const exercises = draft?.exercises ?? EMPTY_EXERCISES;
  const startedAt = draft?.startedAt ?? null;
  const activeWorkoutId = draft?.activeWorkoutId ?? null;

  const [isPaused, setIsPaused] = useState(false);
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

  const computedElapsed = startedAt
    ? Math.max(0, nowSec - Math.floor(new Date(startedAt).getTime() / 1000))
    : 0;

  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(null);
  const [prevIsPaused, setPrevIsPaused] = useState(isPaused);
  if (isPaused !== prevIsPaused) {
    setPrevIsPaused(isPaused);
    setFrozenElapsed(isPaused ? computedElapsed : null);
  }
  const elapsed = frozenElapsed ?? computedElapsed;

  useEffect(() => {
    if (draft === undefined) return;
    if (hasFinishedRef.current || showTriumph || isAbandoning) return;
    if (draft?.activeWorkoutId) return;
    router.replace("/workout");
  }, [draft, router, showTriumph, isAbandoning]);

  const previousSetsMap = useMemo(() => {
    if (!workoutLogs) return new Map();
    return buildPreviousSetsMap(exercises, workoutLogs);
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

  const incompleteExists = useMemo(
    () => exercises.some((ex) => ex.sets.some((s) => !s.completed)),
    [exercises]
  );

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const session = program?.sessions.find((s) => s.id === sessionId);
    const completedAt = new Date().toISOString();

    const capturedMinutes = minutes;
    const capturedSeconds = seconds;

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
        setPreviousRecords(derivePersonalRecords(previousLogs, exerciseMap));
        setNewRecords(derivePersonalRecords([...previousLogs, createdLog], exerciseMap)
          .filter((record) => record.workoutLogId === createdLog.id));
        setTriumphData({
          volume: volume(createdLog.exercises.flatMap((exercise) => exercise.sets.filter((set) => set.completed))),
          minutes: capturedMinutes,
          seconds: capturedSeconds,
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
      await clearDraft();
      router.replace("/workout");
    } catch (err) {
      console.warn("[abandonWorkout] clearDraft failed", err);
      hasFinishedRef.current = false;
      setIsAbandoning(false);
    }
  };

  const toggleSetCompleted = (exerciseId: string, setIndex: number) => {
    const before = exercises.find((e) => e.id === exerciseId)?.sets[setIndex];
    if (!before) return;
    const willComplete = !before.completed;
    if (willComplete && (before.weight === 0 || before.reps === 0)) return;

    void updateDraftExercises((current) =>
      current.map((e) =>
        e.id !== exerciseId
          ? e
          : {
              ...e,
              sets: e.sets.map((s, i) =>
                i === setIndex ? { ...s, completed: willComplete } : s
              ),
            }
      )
    );
    if (willComplete) {
      restStore.startRestTimer(restDurationSeconds);
      setLastActiveExerciseId(exerciseId);
    }
  };

  const addExercise = (exerciseId: string) => {
    void updateDraftExercises((current) => {
      const id = generateId();
      return [
        ...current,
        {
          id,
          exerciseId,
          workoutLogId: activeWorkoutId ?? id,
          sortOrder: current.length,
          sets: [
            {
              id: generateId(),
              loggedExerciseId: id,
              type: "working",
              setOrder: 0,
              reps: 0,
              weight: 0,
              completed: false,
            },
          ],
        },
      ];
    });
  };

  const removeExercise = (loggedExerciseId: string) => {
    void updateDraftExercises((current) =>
      current
        .filter((e) => e.id !== loggedExerciseId)
        .map((e, i) => ({ ...e, sortOrder: i }))
    );
  };

  const addSet = (loggedExerciseId: string) => {
    void updateDraftExercises((current) =>
      current.map((e) => {
        if (e.id !== loggedExerciseId) return e;
        const lastSet = e.sets[e.sets.length - 1];
        const newSet: LoggedSet = {
          id: generateId(),
          loggedExerciseId: e.id,
          type: "working",
          setOrder: (lastSet?.setOrder ?? -1) + 1,
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          completed: false,
        };
        return { ...e, sets: [...e.sets, newSet] };
      })
    );
  };

  const removeSet = (loggedExerciseId: string, setIndex: number) => {
    void updateDraftExercises((current) =>
      current.map((e) => {
        if (e.id !== loggedExerciseId) return e;
        return {
          ...e,
          sets: e.sets
            .filter((_, i) => i !== setIndex)
            .map((s, i) => ({ ...s, setOrder: i })),
        };
      })
    );
  };

  const updateSet = (
    loggedExerciseId: string,
    setIndex: number,
    data: Partial<LoggedSet>,
    options?: { propagateWeight?: boolean; baselineWeight?: number }
  ) => {
    void updateDraftExercises((current) =>
      current.map((e) => {
        if (e.id !== loggedExerciseId) return e;
        return updateLoggedSet(e, setIndex, data, options);
      })
    );
  };

  const updateExercise = (
    loggedExerciseId: string,
    data: Partial<Pick<LoggedExercise, "notes" | "excludeFromStats">>
  ) => {
    void updateDraftExercises((current) =>
      current.map((e) => (e.id === loggedExerciseId ? { ...e, ...data } : e))
    );
  };

  const swapExercise = async (loggedExerciseId: string, newExerciseId: string) => {
    const original = exercises.find((e) => e.id === loggedExerciseId);
    if (!original || original.exerciseId === newExerciseId) return;
    await updateDraftExercises((current) =>
      current.map((e) =>
        e.id === loggedExerciseId
          ? {
              ...e,
              exerciseId: newExerciseId,
              exercise: undefined,
              notes: undefined,
              excludeFromStats: undefined,
              sets: e.sets.map((s) => ({
                ...s,
                id: generateId(),
                weight: 0,
                reps: 0,
                completed: false,
              })),
            }
          : e
      )
    );
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
    isPaused,
    togglePause: () => setIsPaused(!isPaused),
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
    programId: program?.sessions.some((s) => s.id === sessionId) ? program.id : undefined,
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
