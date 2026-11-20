import { TABLES, getDb } from "@/lib/db/database";
import type { LoggedExercise, WorkoutDraft } from "@/lib/db/types";

// Single-row store for the in-progress workout ("active workout" in
// CONTEXT.md). Mirrors the web app's src/lib/repositories/drafts.ts,
// but synchronous on top of expo-sqlite.
const DRAFT_ID = "active" as const;

type Row = { data: string };

function emptyDraft(): WorkoutDraft {
  return {
    id: DRAFT_ID,
    activeWorkoutId: null,
    sessionId: null,
    exercises: [],
    startedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

type DraftPatch = Partial<Omit<WorkoutDraft, "id" | "updatedAt">>;
type DraftPatcher = DraftPatch | ((current: WorkoutDraft) => DraftPatch);

export function getDraft(): WorkoutDraft {
  const row = getDb().getFirstSync<Row>(`SELECT data FROM ${TABLES.workoutDrafts} WHERE id = ?`, DRAFT_ID);
  return row ? (JSON.parse(row.data) as WorkoutDraft) : emptyDraft();
}

export function hasActiveDraft(draft: WorkoutDraft): boolean {
  return draft.activeWorkoutId !== null;
}

export function saveDraft(patch: DraftPatcher): WorkoutDraft {
  const current = getDraft();
  const resolved = typeof patch === "function" ? patch(current) : patch;
  const draft: WorkoutDraft = { ...current, ...resolved, id: DRAFT_ID, updatedAt: new Date().toISOString() };
  getDb().runSync(
    `INSERT OR REPLACE INTO ${TABLES.workoutDrafts} (id, updated_at, data) VALUES (?, ?, ?)`,
    draft.id,
    draft.updatedAt,
    JSON.stringify(draft),
  );
  return draft;
}

export function updateDraftExercises(updater: (exercises: LoggedExercise[]) => LoggedExercise[]): WorkoutDraft {
  return saveDraft((current) => ({ exercises: updater(current.exercises) }));
}

export function clearDraft() {
  getDb().runSync(`DELETE FROM ${TABLES.workoutDrafts} WHERE id = ?`, DRAFT_ID);
}

export function initDraft(
  sessionId: string,
  activeWorkoutId: string,
  exercises: LoggedExercise[],
  startedAt: string,
): WorkoutDraft {
  return saveDraft({ sessionId, activeWorkoutId, exercises, startedAt });
}
