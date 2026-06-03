"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore } from "@/lib/store/workout-store";
import {
  useActiveProgram,
  useCreatePersonalRecord,
  useCreateWorkoutLog,
  useExercises,
  useWorkoutLogs,
} from "@/lib/hooks/use-queries";
import { createPRsFromWorkout } from "@/lib/db/queries";
import { volume } from "@/lib/training-metrics";
import type { Exercise, PersonalRecord, WorkoutLog } from "@/lib/db/types";

export interface UseActiveWorkoutResult {
  exerciseMap: Map<string, Exercise>;
  previousSetsMap: Map<string, ({ weight: number; reps: number } | null)[]>;
  activeExerciseId: string | undefined;
  elapsed: number;
  minutes: number;
  seconds: number;
  isPaused: boolean;
  togglePause: () => void;
  completedSetsCount: number;
  totalSetsCount: number;
  totalVolume: number;
  disableFinish: boolean;
  handleFinish: () => void;
  confirmFinish: () => void;
  showConfirmFinish: boolean;
  setShowConfirmFinish: (b: boolean) => void;
  abandonWorkout: () => void;
  showTriumph: boolean;
  newRecords: PersonalRecord[];
  handleCloseTriumph: () => void;
  markSetCompleted: (exerciseId: string, setIndex: number) => void;
}

/**
 * Owns the active-workout lifecycle: timer tick, session bootstrap,
 * finish orchestration (PR generation + mutation dispatch), and the
 * pure derivations the page renders.
 *
 * Test surface (callable in isolation, no React tree required):
 *   - createPRsFromWorkout(loggedExercises, exerciseMap, completedAt):
 *     empty input -> empty array; completed sets with weight>0 -> a
 *     weight PR; completed sets with sum(w*r)>0 -> a volume PR; the
 *     estimated_1rm PRType is defined but not emitted (gap preserved).
 *   - useActiveWorkout returns the full surface above; the page
 *     consumes it as data + actions, the render tree mounts in JSX.
 */
export function useActiveWorkout(
  sessionId: string | undefined
): UseActiveWorkoutResult {
  const router = useRouter();
  const store = useWorkoutStore();
  const { data: allExercises } = useExercises();
  const { data: program, isLoading: programLoading } = useActiveProgram();
  const createWorkoutLog = useCreateWorkoutLog();
  const createPersonalRecord = useCreatePersonalRecord();
  const { data: workoutLogs } = useWorkoutLogs(10);

  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTriumph, setShowTriumph] = useState(false);
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);
  const [lastActiveExerciseId, setLastActiveExerciseId] = useState<string | null>(null);

  useEffect(() => {
    if (!store.startedAt || isPaused) return;
    const interval = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - new Date(store.startedAt!).getTime()) / 1000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [store.startedAt, isPaused]);

  useEffect(() => {
    if (store.activeWorkoutId) return;
    if (!sessionId) {
      router.replace("/workout");
      return;
    }
    if (programLoading || !program) return;

    const session = program.sessions.find((s) => s.id === sessionId);
    if (!session) {
      router.replace("/workout");
      return;
    }

    const exercises = session.exercises
      .filter((se) => se.exercise)
      .map((se) => ({
        exerciseId: se.exerciseId,
        sets: se.targetSets,
      }));

    store.startWorkout(sessionId, exercises);
  }, [sessionId, program, programLoading, store.activeWorkoutId]);

  const exerciseMap = useMemo(
    () => new Map(allExercises?.map((e) => [e.id, e])),
    [allExercises]
  );

  const previousSetsMap = useMemo(() => {
    const map = new Map<string, ({ weight: number; reps: number } | null)[]>();
    if (!workoutLogs) return map;
    for (const ex of store.exercises) {
      for (const log of workoutLogs) {
        const loggedEx = log.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (loggedEx) {
          const completed = [...loggedEx.sets]
            .filter((s) => s.completed)
            .sort((a, b) => a.setOrder - b.setOrder);
          map.set(ex.id, completed.map((s) => ({ weight: s.weight, reps: s.reps })));
          break;
        }
      }
    }
    return map;
  }, [workoutLogs, store.exercises]);

  const totalVolume = useMemo(
    () => volume(store.exercises.flatMap((e) => e.sets.filter((s) => s.completed))),
    [store.exercises]
  );

  const completedSetsCount = useMemo(
    () =>
      store.exercises.reduce(
        (sum, e) => sum + e.sets.filter((s) => s.completed).length,
        0
      ),
    [store.exercises]
  );

  const totalSetsCount = useMemo(
    () => store.exercises.reduce((sum, e) => sum + e.sets.length, 0),
    [store.exercises]
  );

  const activeExerciseId = useMemo(() => {
    const lastEx = lastActiveExerciseId
      ? store.exercises.find((e) => e.id === lastActiveExerciseId)
      : null;
    if (lastEx && lastEx.sets.some((s) => !s.completed)) {
      return lastEx.id;
    }
    return (
      store.exercises.find((ex) => ex.sets.some((s) => !s.completed))?.id ||
      store.exercises[store.exercises.length - 1]?.id
    );
  }, [lastActiveExerciseId, store.exercises]);

  const hasNoData = useMemo(
    () => !store.exercises.some((ex) => ex.sets.some((s) => s.weight > 0)),
    [store.exercises]
  );
  const hasEmptyComplete = useMemo(
    () =>
      store.exercises.some((ex) =>
        ex.sets.some((s) => s.completed && s.reps === 0)
      ),
    [store.exercises]
  );
  const disableFinish = hasNoData || hasEmptyComplete;
  const incompleteExists = useMemo(
    () => store.exercises.some((ex) => ex.sets.some((s) => !s.completed)),
    [store.exercises]
  );

  const finish = () => {
    const session = program?.sessions.find((s) => s.id === sessionId);
    const completedAt = new Date().toISOString();

    const log: Omit<WorkoutLog, "id"> = {
      startedAt: store.startedAt ?? completedAt,
      endedAt: completedAt,
      programId: program?.id,
      sessionId,
      programName: program?.name,
      sessionName: session?.name,
      exercises: store.exercises,
    };

    const records = createPRsFromWorkout(
      store.exercises,
      exerciseMap,
      completedAt
    );

    void createWorkoutLog.mutateAsync(log).catch((err) => {
      console.warn("[finishWorkout] createWorkoutLog failed", err);
    });
    for (const rec of records) {
      const { id: _id, ...payload } = rec;
      void createPersonalRecord.mutateAsync(
        payload as Omit<PersonalRecord, "id">
      ).catch((err) => {
        console.warn("[finishWorkout] createPersonalRecord failed", err);
      });
    }

    store.finishWorkout();
    setNewRecords(records);
    setShowTriumph(true);
  };

  const handleFinish = () => {
    if (incompleteExists) {
      setShowConfirmFinish(true);
      return;
    }
    finish();
  };

  const confirmFinish = () => {
    setShowConfirmFinish(false);
    finish();
  };

  const handleCloseTriumph = () => {
    store.reset();
    router.push("/dashboard");
  };

  const abandonWorkout = () => {
    store.reset();
    router.push("/workout");
  };

  const markSetCompleted = (exerciseId: string, setIndex: number) => {
    store.markSetCompleted(exerciseId, setIndex);
    setLastActiveExerciseId(exerciseId);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return {
    exerciseMap,
    previousSetsMap,
    activeExerciseId,
    elapsed,
    minutes,
    seconds,
    isPaused,
    togglePause: () => setIsPaused(!isPaused),
    completedSetsCount,
    totalSetsCount,
    totalVolume,
    disableFinish,
    handleFinish,
    confirmFinish,
    showConfirmFinish,
    setShowConfirmFinish,
    abandonWorkout,
    showTriumph,
    newRecords,
    handleCloseTriumph,
    markSetCompleted,
  };
}
