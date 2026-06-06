import type { LoggedExercise, WorkoutSession } from "@/lib/db/types";
import { initDraft } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/calculations";

export function buildLoggedExercisesFromSession(
  session: WorkoutSession
): LoggedExercise[] {
  return session.exercises
    .filter((se) => se.exerciseId)
    .map((se) => {
      const leId = generateId();
      return {
        id: leId,
        exerciseId: se.exerciseId,
        workoutLogId: session.id,
        sortOrder: se.sortOrder,
        sets: Array.from({ length: se.targetSets }, (_, si) => ({
          id: generateId(),
          loggedExerciseId: leId,
          type: si === 0 ? ("warmup" as const) : ("working" as const),
          setOrder: si,
          reps: 0,
          weight: 0,
          completed: false,
        })),
      };
    });
}

export async function startWorkoutDraft(session: WorkoutSession) {
  const exercises = buildLoggedExercisesFromSession(session);
  return initDraft(
    session.id,
    session.id,
    exercises,
    new Date().toISOString()
  );
}
