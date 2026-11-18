import type { LoggedExercise, LoggedSet, WorkoutSession } from "@/lib/db/types";
import { initDraft } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/id";

export function newWorkingSet(loggedExerciseId: string, setOrder: number): LoggedSet {
  return { id: generateId(), loggedExerciseId, setOrder, type: "working", reps: 0, weight: 0, completed: false };
}

export function buildLoggedExercisesFromSession(
  session: WorkoutSession, workoutLogId: string
): LoggedExercise[] {
  return session.exercises
    .filter((se) => se.exerciseId)
    .map((se) => {
      const leId = generateId();
      return {
        id: leId,
        exerciseId: se.exerciseId,
        exercise: se.exercise,
        workoutLogId,
        sortOrder: se.sortOrder,
        sets: Array.from({ length: se.targetSets }, (_, index) => newWorkingSet(leId, index)),
      };
    });
}

export async function startWorkoutDraft(session: WorkoutSession) {
  const workoutId = generateId();
  const exercises = buildLoggedExercisesFromSession(session, workoutId);
  return initDraft(
    session.id,
    workoutId,
    exercises,
    new Date().toISOString()
  );
}
