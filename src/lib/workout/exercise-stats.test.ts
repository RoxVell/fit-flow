import { describe, expect, it } from "vitest";
import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";
import {
  isExcludedFromStats,
  toExerciseDetailedHistorySession,
  toExerciseHistoryPoint,
} from "./exercise-stats";

function makeExercise(
  overrides?: Partial<LoggedExercise> & { weight?: number; reps?: number }
): LoggedExercise {
  const { weight = 100, reps = 5, ...rest } = overrides ?? {};
  return {
    id: "le-1",
    exerciseId: "bench",
    workoutLogId: "log-1",
    sortOrder: 0,
    sets: [
      {
        id: "set-1",
        loggedExerciseId: "le-1",
        type: "working",
        setOrder: 0,
        weight,
        reps,
        completed: true,
      },
    ],
    ...rest,
  };
}

function makeLog(exercises: LoggedExercise[]): Pick<WorkoutLog, "startedAt" | "exercises"> {
  return {
    startedAt: "2026-06-20T12:00:00.000Z",
    exercises,
  };
}

describe("isExcludedFromStats", () => {
  it("is false when the flag is missing", () => {
    expect(isExcludedFromStats(makeExercise())).toBe(false);
  });

  it("is true when the flag is set", () => {
    expect(isExcludedFromStats(makeExercise({ excludeFromStats: true }))).toBe(true);
  });
});

describe("toExerciseHistoryPoint", () => {
  it("returns volume, max weight, and e1RM for counted sessions", () => {
    const point = toExerciseHistoryPoint(makeLog([makeExercise()]), "bench");
    expect(point).toMatchObject({
      date: "2026-06-20T12:00:00.000Z",
      volume: 500,
      maxWeight: 100,
    });
    expect(point?.estimated1RM).toBeGreaterThan(100);
  });

  it("omits sessions marked excludeFromStats", () => {
    const point = toExerciseHistoryPoint(
      makeLog([makeExercise({ excludeFromStats: true, weight: 60 })]),
      "bench"
    );
    expect(point).toBeNull();
  });
});

describe("toExerciseDetailedHistorySession", () => {
  it("keeps excluded sessions with notes for history display", () => {
    const session = toExerciseDetailedHistorySession(
      makeLog([
        makeExercise({
          excludeFromStats: true,
          notes: "  close-grip handle  ",
          weight: 60,
        }),
      ]),
      "bench"
    );

    expect(session).toMatchObject({
      excludeFromStats: true,
      notes: "close-grip handle",
      bestE1RM: 60 * (1 + 5 / 30),
    });
    expect(session?.sets).toHaveLength(1);
  });
});
