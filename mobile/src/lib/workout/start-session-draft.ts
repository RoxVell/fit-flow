import type { LoggedExercise, WorkoutSession } from "@/lib/db/types";
import { initDraft } from "@/lib/repositories/drafts";
import { generateId } from "@/lib/utils/id";

// Copied from the web app's src/lib/workout/start-session-draft.ts.
// Every target set is pre-created empty so the active screen can render rows
// immediately; `workoutLogId` is the session id until a WorkoutLog exists.
export function buildLoggedExercisesFromSession(session: WorkoutSession): LoggedExercise[] {
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
          type: "working" as const,
          setOrder: si,
          reps: 0,
          weight: 0,
          completed: false,
        })),
      };
    });
}

export function startWorkoutDraft(session: WorkoutSession) {
  return initDraft(session.id, session.id, buildLoggedExercisesFromSession(session), new Date().toISOString());
}

export function recommendedSession<T extends { dayOfWeek: number }>(
  sessions: readonly T[],
  today = new Date().getDay(),
): T | null {
  if (sessions.length === 0) return null;
  return sessions.find((session) => session.dayOfWeek === today) ?? sessions[0] ?? null;
}
