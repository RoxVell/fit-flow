import { describe, expect, it } from "vitest";
import type { LoggedExercise } from "@/lib/db/types";
import { updateLoggedSet } from "@/lib/hooks/use-active-workout";

function buildExercise(overrides?: Partial<LoggedExercise>): LoggedExercise {
  return {
    id: "ex-1",
    exerciseId: "bench-press",
    workoutLogId: "log-1",
    sortOrder: 0,
    sets: [
      {
        id: "set-1",
        loggedExerciseId: "ex-1",
        type: "working",
        setOrder: 0,
        reps: 10,
        weight: 100,
        completed: false,
      },
      {
        id: "set-2",
        loggedExerciseId: "ex-1",
        type: "working",
        setOrder: 1,
        reps: 10,
        weight: 100,
        completed: false,
      },
      {
        id: "set-3",
        loggedExerciseId: "ex-1",
        type: "working",
        setOrder: 2,
        reps: 10,
        weight: 100,
        completed: true,
      },
    ],
    ...overrides,
  };
}

describe("updateLoggedSet", () => {
  it("propagates a lowered weight to all remaining unfinished sets", () => {
    const exercise = buildExercise();

    const updated = updateLoggedSet(
      exercise,
      0,
      { weight: 90 },
      { propagateWeight: true }
    );

    expect(updated.sets.map((set) => set.weight)).toEqual([90, 90, 100]);
  });
});
