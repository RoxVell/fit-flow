import type { LoggedExercise, LoggedSet } from "@/lib/db/types";
import { generateId } from "@/lib/utils/id";

export function updateLoggedSet(
  exercise: LoggedExercise,
  setIndex: number,
  data: Partial<LoggedSet>,
  options?: { propagateWeight?: boolean },
): LoggedExercise {
  const currentSet = exercise.sets[setIndex];
  if (!currentSet) return exercise;

  const newWeight = data.weight ?? currentSet.weight;
  const shouldPropagateWeight = options?.propagateWeight && data.weight !== undefined;

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

export function mapExercise(
  exercises: LoggedExercise[],
  loggedExerciseId: string,
  mapper: (exercise: LoggedExercise) => LoggedExercise,
): LoggedExercise[] {
  return exercises.map((exercise) => (exercise.id === loggedExerciseId ? mapper(exercise) : exercise));
}

export function toggleSetCompleted(exercise: LoggedExercise, setIndex: number): LoggedExercise {
  const current = exercise.sets[setIndex];
  if (!current) return exercise;
  const willComplete = !current.completed;
  if (willComplete && (current.weight === 0 || current.reps === 0)) return exercise;
  return {
    ...exercise,
    sets: exercise.sets.map((set, index) => (index === setIndex ? { ...set, completed: willComplete } : set)),
  };
}

export function addSet(exercise: LoggedExercise): LoggedExercise {
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const next: LoggedSet = {
    id: generateId(),
    loggedExerciseId: exercise.id,
    type: "working",
    setOrder: (lastSet?.setOrder ?? -1) + 1,
    reps: lastSet?.reps || 10,
    weight: lastSet?.weight || 0,
    completed: false,
  };
  return { ...exercise, sets: [...exercise.sets, next] };
}

export function removeSet(exercise: LoggedExercise, setIndex: number): LoggedExercise {
  if (exercise.sets.length <= 1) return exercise;
  return {
    ...exercise,
    sets: exercise.sets.filter((_, index) => index !== setIndex).map((set, index) => ({ ...set, setOrder: index })),
  };
}

export function appendExercise(exercises: LoggedExercise[], exerciseId: string, workoutLogId: string): LoggedExercise[] {
  const id = generateId();
  return [
    ...exercises,
    {
      id,
      exerciseId,
      workoutLogId,
      sortOrder: exercises.length,
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
}

export function removeExercise(exercises: LoggedExercise[], loggedExerciseId: string): LoggedExercise[] {
  return exercises.filter((exercise) => exercise.id !== loggedExerciseId).map((exercise, index) => ({ ...exercise, sortOrder: index }));
}

export function swapExercise(exercise: LoggedExercise, newExerciseId: string): LoggedExercise {
  return {
    ...exercise,
    exerciseId: newExerciseId,
    notes: undefined,
    excludeFromStats: undefined,
    sets: exercise.sets.map((set) => ({
      ...set,
      id: generateId(),
      weight: 0,
      reps: 0,
      completed: false,
    })),
  };
}
