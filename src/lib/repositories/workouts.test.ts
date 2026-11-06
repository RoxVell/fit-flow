import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import type { LoggedExercise } from "@/lib/db/types";
import { initDraft, updateDraftExercises } from "./drafts";
import { finishWorkout } from "./workouts";

const START = "2026-06-01T12:00:00.000Z";
const END = "2026-06-01T13:00:00.000Z";
const exercise: LoggedExercise = {
  id: "bench-entry", exerciseId: "bench", workoutLogId: "session", sortOrder: 0,
  sets: [{ id: "set", loggedExerciseId: "bench-entry", type: "working", setOrder: 0,
    reps: 5, weight: 50, completed: false }],
};

beforeEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([db.workoutLogs.clear(), db.workoutDrafts.clear(), db.syncQueue.clear()]);
  await initDraft("session", "workout", [exercise], START);
});

describe("finishWorkout", () => {
  it("waits for pending edits, persists the log and outbox, and removes the draft", async () => {
    const pendingEdit = updateDraftExercises((exercises) => exercises.map((entry) => ({
      ...entry, sets: entry.sets.map((set) => ({ ...set, completed: true, weight: 70 })),
    })));
    const log = await finishWorkout("workout", { endedAt: END });
    await pendingEdit;
    expect(log.exercises[0].sets[0]).toMatchObject({ weight: 70, completed: true });
    expect(log.exercises[0].workoutLogId).toBe(log.id);
    expect(await db.workoutDrafts.get("active")).toBeUndefined();
    expect(await db.syncQueue.toArray()).toEqual([expect.objectContaining({
      entityType: "workoutLog", entityId: log.id, payload: log,
    })]);
  });

  it("rolls back the log and retains the draft when the outbox write fails", async () => {
    vi.spyOn(db.syncQueue, "put").mockRejectedValueOnce(new Error("Storage full"));
    await expect(finishWorkout("workout", { endedAt: END })).rejects.toThrow("Storage full");
    expect(await db.workoutLogs.count()).toBe(0);
    expect(await db.workoutDrafts.get("active")).toBeDefined();
    expect(await db.syncQueue.count()).toBe(0);
    await expect(finishWorkout("workout", { endedAt: END })).resolves.toMatchObject({ id: "workout" });
  });

  it("is idempotent and never removes a different active draft", async () => {
    await finishWorkout("workout", { endedAt: END });
    await initDraft("session", "next-workout", [exercise], END);
    await finishWorkout("workout", { endedAt: END });
    expect(await db.workoutLogs.count()).toBe(1);
    expect(await db.syncQueue.count()).toBe(1);
    expect((await db.workoutDrafts.get("active"))?.activeWorkoutId).toBe("next-workout");
  });
});
