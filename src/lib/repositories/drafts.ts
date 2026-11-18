import { db } from "@/lib/db/dexie";
import type { LoggedExercise, WorkoutDraft } from "@/lib/db/types";

let draftWriteChain: Promise<unknown> = Promise.resolve();

export function enqueueDraftWrite<T>(fn: () => Promise<T>): Promise<T> {
  const result = draftWriteChain.then(fn);
  draftWriteChain = result.catch(() => {});
  return result;
}

function matchingDraft(activeWorkoutId: string | null) {
  return db.workoutDrafts.where("id").equals("active")
    .and((draft) => !!activeWorkoutId && draft.activeWorkoutId === activeWorkoutId);
}

export function updateDraftExercises(
  activeWorkoutId: string | null,
  updater: (exercises: LoggedExercise[]) => LoggedExercise[]
) {
  return enqueueDraftWrite(() => matchingDraft(activeWorkoutId).modify((draft) => {
    draft.exercises = updater(draft.exercises);
    draft.updatedAt = new Date().toISOString();
  }));
}

export function toggleDraftPause(activeWorkoutId: string | null, now: number) {
  return enqueueDraftWrite(() => matchingDraft(activeWorkoutId).modify((draft) => {
    if (draft.pausedAt === undefined) {
      draft.pausedAt = now;
    } else {
      draft.pausedSeconds = (draft.pausedSeconds ?? 0) + Math.max(0, now - draft.pausedAt);
      delete draft.pausedAt;
    }
    draft.updatedAt = new Date().toISOString();
  }));
}

export function elapsedWorkoutSeconds(draft: WorkoutDraft | null | undefined, now: number): number {
  if (!draft?.startedAt) return 0;
  const started = Math.floor(new Date(draft.startedAt).getTime() / 1000);
  return Math.max(0, (draft.pausedAt ?? now) - started - (draft.pausedSeconds ?? 0));
}

export function clearDraft(activeWorkoutId: string | null) {
  return enqueueDraftWrite(() => matchingDraft(activeWorkoutId).delete());
}

export function initDraft(
  sessionId: string,
  activeWorkoutId: string,
  exercises: LoggedExercise[],
  startedAt: string
): Promise<WorkoutDraft> {
  return enqueueDraftWrite(() => db.transaction("rw", db.workoutDrafts, async () => {
    const existing = await db.workoutDrafts.get("active");
    if (existing?.activeWorkoutId) return existing;
    const draft: WorkoutDraft = {
      id: "active", sessionId, activeWorkoutId, exercises, startedAt,
      updatedAt: new Date().toISOString(),
    };
    await db.workoutDrafts.put(draft);
    return draft;
  }));
}
