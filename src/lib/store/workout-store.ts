import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoggedExercise, LoggedSet, SetType } from "@/lib/db/types";
import { generateId } from "@/lib/utils/calculations";

interface RestTimerState {
  endTime: number | null;
  duration: number;
  isRunning: boolean;
}

interface WorkoutStore {
  // Active workout
  activeWorkoutId: string | null;
  exercises: LoggedExercise[];
  startedAt: string | null;
  isOfflineDirty: boolean;

  // Rest timer
  restTimer: RestTimerState;

  // Actions
  startWorkout: (sessionId?: string, exercises?: { exerciseId: string; sets: number }[]) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (loggedExerciseId: string) => void;
  swapExercise: (loggedExerciseId: string, newExerciseId: string) => void;
  addSet: (loggedExerciseId: string) => void;
  removeSet: (loggedExerciseId: string, setIndex: number) => void;
  updateSet: (
    loggedExerciseId: string,
    setIndex: number,
    data: Partial<LoggedSet>
  ) => void;
  markSetCompleted: (loggedExerciseId: string, setIndex: number) => void;
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
  finishWorkout: () => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeWorkoutId: null,
      exercises: [],
      startedAt: null,
      isOfflineDirty: false,
      restTimer: { endTime: null, duration: 60, isRunning: false },

      startWorkout: (sessionId?: string, initialExercises?: { exerciseId: string; sets: number }[]) => {
        const id = sessionId || generateId();
        const exercises: LoggedExercise[] = (initialExercises || []).map((e, idx) => {
          const leId = generateId();
          return {
            id: leId,
            exerciseId: e.exerciseId,
            workoutLogId: id,
            sortOrder: idx,
            sets: Array.from({ length: e.sets }, (_, si) => ({
              id: generateId(),
              loggedExerciseId: leId,
              type: si === 0 ? ("warmup" as const) : ("working" as const),
              setOrder: si,
              reps: 10,
              weight: si === 0 ? 0 : 0,
              completed: false,
            })),
          };
        });
        set({
          activeWorkoutId: id,
          exercises,
          startedAt: new Date().toISOString(),
          isOfflineDirty: false,
        });
      },

      addExercise: (exerciseId: string) => {
        const id = generateId();
        set((state) => ({
          exercises: [
            ...state.exercises,
            {
              id,
              exerciseId,
              workoutLogId: state.activeWorkoutId!,
              sortOrder: state.exercises.length,
              sets: [{ id: generateId(), loggedExerciseId: id, type: "working", setOrder: 0, reps: 10, weight: 0, completed: false }],
            },
          ],
          isOfflineDirty: true,
        }));
      },

      removeExercise: (loggedExerciseId: string) => {
        set((state) => ({
          exercises: state.exercises
            .filter((e) => e.id !== loggedExerciseId)
            .map((e, i) => ({ ...e, sortOrder: i })),
          isOfflineDirty: true,
        }));
      },

      swapExercise: (loggedExerciseId: string, newExerciseId: string) => {
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id === loggedExerciseId ? { ...e, exerciseId: newExerciseId } : e
          ),
          isOfflineDirty: true,
        }));
      },

      addSet: (loggedExerciseId: string) => {
        set((state) => ({
          exercises: state.exercises.map((e) => {
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
          }),
          isOfflineDirty: true,
        }));
      },

      removeSet: (loggedExerciseId: string, setIndex: number) => {
        set((state) => ({
          exercises: state.exercises.map((e) => {
            if (e.id !== loggedExerciseId) return e;
            const newSets = e.sets
              .filter((_, i) => i !== setIndex)
              .map((s, i) => ({ ...s, setOrder: i }));
            return { ...e, sets: newSets };
          }),
          isOfflineDirty: true,
        }));
      },

      updateSet: (loggedExerciseId: string, setIndex: number, data: Partial<LoggedSet>) => {
        set((state) => ({
          exercises: state.exercises.map((e) => {
            if (e.id !== loggedExerciseId) return e;
            const newSets = e.sets.map((s, i) => (i === setIndex ? { ...s, ...data } : s));
            return { ...e, sets: newSets };
          }),
          isOfflineDirty: true,
        }));
      },

      markSetCompleted: (loggedExerciseId: string, setIndex: number) => {
        const store = get();
        const exercise = store.exercises.find((e) => e.id === loggedExerciseId);
        if (!exercise) return;

        const targetSet = exercise.sets[setIndex];
        if (!targetSet || targetSet.completed) return;

        set((state) => ({
          exercises: state.exercises.map((e) => {
            if (e.id !== loggedExerciseId) return e;
            const newSets = e.sets.map((s, i) =>
              i === setIndex ? { ...s, completed: true } : s
            );
            return { ...e, sets: newSets };
          }),
          restTimer: { endTime: Date.now() + 90 * 1000, duration: 90, isRunning: true },
          isOfflineDirty: true,
        }));
      },

      startRestTimer: (duration: number) => {
        set({
          restTimer: { endTime: Date.now() + duration * 1000, duration, isRunning: true },
        });
      },

      stopRestTimer: () => {
        set((state) => ({
          restTimer: { ...state.restTimer, endTime: null, isRunning: false },
        }));
      },

      tickRestTimer: () => {
        const { restTimer } = get();
        if (!restTimer.isRunning || !restTimer.endTime) return;
        if (Date.now() >= restTimer.endTime) {
          set({ restTimer: { ...restTimer, isRunning: false, endTime: null } });
        }
      },

      finishWorkout: () => {
        set({ restTimer: { endTime: null, duration: 60, isRunning: false } });
      },

      reset: () => {
        set({
          activeWorkoutId: null,
          exercises: [],
          startedAt: null,
          isOfflineDirty: false,
          restTimer: { endTime: null, duration: 60, isRunning: false },
        });
      },
    }),
    {
      name: "fitflow-workout",
      partialize: (state) => ({
        activeWorkoutId: state.activeWorkoutId,
        exercises: state.exercises,
        startedAt: state.startedAt,
        isOfflineDirty: state.isOfflineDirty,
      }),
    }
  )
);
