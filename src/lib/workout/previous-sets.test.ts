import { describe, expect, it } from "vitest";
import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";
import { buildPreviousSetsMap } from "./previous-sets";

function makeLogged(
  exerciseId: string,
  sets: { weight: number; reps: number }[],
  overrides?: Partial<LoggedExercise>
): LoggedExercise {
  const id = overrides?.id ?? `le-${exerciseId}`;
  return {
    id,
    exerciseId,
    workoutLogId: "log-1",
    sortOrder: 0,
    sets: sets.map((set, index) => ({
      id: `${id}-set-${index}`,
      loggedExerciseId: id,
      type: "working",
      setOrder: index,
      weight: set.weight,
      reps: set.reps,
      completed: true,
    })),
    ...overrides,
  };
}

function makeLog(
  exercises: LoggedExercise[],
  startedAt = "2026-06-20T12:00:00.000Z"
): WorkoutLog {
  return {
    id: `log-${startedAt}`,
    startedAt,
    endedAt: startedAt,
    exercises,
  };
}

describe("buildPreviousSetsMap", () => {
  it("uses the latest counted session and skips excludeFromStats", () => {
    const current = makeLogged("bench", [{ weight: 0, reps: 0 }, { weight: 0, reps: 0 }], {
      id: "current",
    });

    const deload = makeLog(
      [makeLogged("bench", [{ weight: 60, reps: 8 }], { excludeFromStats: true })],
      "2026-06-21T12:00:00.000Z"
    );
    const working = makeLog(
      [makeLogged("bench", [{ weight: 100, reps: 5 }, { weight: 95, reps: 5 }])],
      "2026-06-14T12:00:00.000Z"
    );

    const map = buildPreviousSetsMap([current], [deload, working]);
    expect(map.get("current")).toEqual([
      { weight: 100, reps: 5 },
      { weight: 95, reps: 5 },
    ]);
  });
});
