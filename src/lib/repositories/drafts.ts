import { db } from "@/lib/db/dexie";
import type { LoggedExercise, WorkoutDraft } from "@/lib/db/types";

const DRAFT_ID = "active" as const;

const EMPTY_DRAFT: WorkoutDraft = {
  id: DRAFT_ID,
  activeWorkoutId: null,
  sessionId: null,
  exercises: [],
  startedAt: null,
  updatedAt: new Date().toISOString(),
};

export async function getDraft(): Promise<WorkoutDraft> {
  const draft = await db.workoutDrafts.get(DRAFT_ID);
  return draft ?? EMPTY_DRAFT;
}

export async function saveDraft(
  patch: Partial<Omit<WorkoutDraft, "id" | "updatedAt">>
): Promise<WorkoutDraft> {
  const current = await getDraft();
  const draft: WorkoutDraft = {
    ...current,
    ...patch,
    id: DRAFT_ID,
    updatedAt: new Date().toISOString(),
  };
  await db.workoutDrafts.put(draft);
  return draft;
}

export async function clearDraft(): Promise<void> {
  await db.workoutDrafts.put({
    ...EMPTY_DRAFT,
    updatedAt: new Date().toISOString(),
  });
}

export async function initDraft(
  sessionId: string,
  activeWorkoutId: string,
  exercises: LoggedExercise[],
  startedAt: string
): Promise<WorkoutDraft> {
  return saveDraft({ sessionId, activeWorkoutId, exercises, startedAt });
}
