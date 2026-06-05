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

type DraftPatch = Partial<Omit<WorkoutDraft, "id" | "updatedAt">>;
type DraftPatcher = DraftPatch | ((current: WorkoutDraft) => DraftPatch);

let draftWriteChain: Promise<unknown> = Promise.resolve();

function enqueueDraftWrite<T>(fn: () => Promise<T>): Promise<T> {
  const result = draftWriteChain.then(fn);
  draftWriteChain = result.catch(() => {});
  return result;
}

export async function getDraft(): Promise<WorkoutDraft> {
  const draft = await db.workoutDrafts.get(DRAFT_ID);
  return draft ?? EMPTY_DRAFT;
}

export function saveDraft(patch: DraftPatcher): Promise<WorkoutDraft> {
  return enqueueDraftWrite(async () => {
    const current = await getDraft();
    const resolved = typeof patch === "function" ? patch(current) : patch;
    const draft: WorkoutDraft = {
      ...current,
      ...resolved,
      id: DRAFT_ID,
      updatedAt: new Date().toISOString(),
    };
    await db.workoutDrafts.put(draft);
    return draft;
  });
}

export function updateDraftExercises(
  updater: (exercises: LoggedExercise[]) => LoggedExercise[]
): Promise<WorkoutDraft> {
  return saveDraft((current) => ({ exercises: updater(current.exercises) }));
}

export async function clearDraft(): Promise<void> {
  await saveDraft({
    activeWorkoutId: null,
    sessionId: null,
    exercises: [],
    startedAt: null,
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
