import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import type { WorkoutDraft } from "@/lib/db/types";
import { getDraft, hasActiveDraft } from "@/lib/repositories/drafts";

// Live view of the single workout draft. `isActive` drives the dot badge on
// the Workout tab; the web app derives the same from the Dexie draft row.
export function useActiveWorkout(): { isActive: boolean; draft: WorkoutDraft } {
  const draft = useLiveQuery(getDraft, [TABLES.workoutDrafts]);
  return { isActive: hasActiveDraft(draft), draft };
}
