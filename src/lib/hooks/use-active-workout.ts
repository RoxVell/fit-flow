"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore } from "@/lib/store/workout-store";
import {
  useActiveProgram,
  usePersonalRecords,
  useWorkoutDraft,
  useWorkoutLogs,
} from "@/lib/hooks/use-data";
import { useExerciseLookup } from "@/lib/hooks/use-exercise-lookup";
import { createPRsFromWorkout } from "@/lib/repositories/records";
import { createPersonalRecord } from "@/lib/repositories/records";
import { createWorkoutLog } from "@/lib/repositories/workouts";
import { clearDraft, updateDraftExercises } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/calculations";
import { volume } from "@/lib/training-metrics";
import { buildPreviousSetsMap } from "@/lib/workout/previous-sets";
import type {
  Exercise,
  LoggedExercise,
  LoggedSet,
  PersonalRecord,
  WorkoutLog,
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
  triumphData: { volume: number; minutes: number; seconds: number } | null;
  handleCloseTriumph: () => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (loggedExerciseId: string) => void;
  addSet: (loggedExerciseId: string) => void;
  removeSet: (loggedExerciseId: string, setIndex: number) => void;
  updateSet: (loggedExerciseId: string, setIndex: number, data: Partial<LoggedSet>) => void;
  swapExercise: (loggedExerciseId: string, newExerciseId: string) => void;
}

export function useActiveWorkout(
  sessionId: string | undefined
): UseActiveWorkoutResult {
  const router = useRouter();
  const restStore = useWorkoutStore();
  const draft = useWorkoutDraft();
  const { exerciseMap } = useExerciseLookup();
  const program = useActiveProgram();
  const workoutLogs = useWorkoutLogs(50);
  const personalRecords = usePersonalRecords();

  const exercises = draft?.exercises ?? [];
  const startedAt = draft?.startedAt ?? null;
  const activeWorkoutId = draft?.activeWorkoutId ?? null;

  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTriumph, setShowTriumph] = useState(false);
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);
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

    const log: Omit<WorkoutLog, "id" | "revision" | "updatedAt"> = {
      startedAt: startedAt ?? completedAt,
      endedAt: completedAt,
      programId: program?.id,
      sessionId,
      programName: program?.name,
      sessionName: session?.name,
      exercises,
    };

    const records = createPRsFromWorkout(
      exercises,
      exerciseMap,
      completedAt,
      personalRecords ?? []
    );
    const capturedVolume = totalVolume;
    const capturedMinutes = minutes;
    const capturedSeconds = seconds;

    void createWorkoutLog(log).catch((err) => {
      console.warn("[finishWorkout] createWorkoutLog failed", err);
    });
    for (const rec of records) {
      const { id: _id, ...payload } = rec;
      void createPersonalRecord(payload).catch((err) => {
        console.warn("[finishWorkout] createPersonalRecord failed", err);
      });
    }

    setNewRecords(records);
    setTriumphData({
      volume: capturedVolume,
      minutes: capturedMinutes,
      seconds: capturedSeconds,
    });
    setShowTriumph(true);
    void clearDraft();
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
    void clearDraft();
    router.push("/dashboard");
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
      restStore.startRestTimer(90);
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
    data: Partial<LoggedSet>
  ) => {
    void updateDraftExercises((current) =>
      current.map((e) => {
        if (e.id !== loggedExerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s, i) => (i === setIndex ? { ...s, ...data } : s)),
        };
      })
    );
  };

  const swapExercise = (loggedExerciseId: string, newExerciseId: string) => {
    void updateDraftExercises((current) =>
      current.map((e) =>
        e.id === loggedExerciseId ? { ...e, exerciseId: newExerciseId } : e
      )
    );
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
    triumphData,
    handleCloseTriumph,
    toggleSetCompleted,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    swapExercise,
  };
}
