import { describe, expect, it } from "vitest";
import type { LoggedExercise, WorkoutLog } from "@/lib/db/types";
import {
  aggregateExerciseStats,
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
  it("combines repeated entries and ignores incomplete and excluded sets", () => {
    const first = makeExercise({ weight: 50 });
    const second = makeExercise({ id: "le-2", weight: 70 });
    second.sets.push({ ...second.sets[0], id: "incomplete", weight: 999, completed: false });
    const excluded = makeExercise({ id: "le-3", weight: 200, excludeFromStats: true });
    const point = toExerciseHistoryPoint(makeLog([excluded, first, second]), "bench");

    expect(point).toMatchObject({ volume: 600, maxWeight: 70 });
    expect(point?.estimated1RM).toBeCloseTo(70 * (1 + 5 / 30));
    expect(aggregateExerciseStats([excluded, first, second], "bench").sets).toHaveLength(2);
  });

  it("omits entries without completed sets but retains completed bodyweight sets", () => {
    const unfinished = makeExercise();
    unfinished.sets[0].completed = false;
    expect(toExerciseHistoryPoint(makeLog([unfinished]), "bench")).toBeNull();

    const bodyweight = aggregateExerciseStats([makeExercise({ weight: 0, reps: 10 })]);
    expect(bodyweight.sets).toHaveLength(1);
    expect(bodyweight.estimated1RM).toBeNull();
    expect(bodyweight.volume).toBe(0);
  });

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
  it("keeps repeated and excluded entries visible while counting only eligible performance", () => {
    const session = toExerciseDetailedHistorySession(makeLog([
      makeExercise({ id: "excluded", weight: 200, excludeFromStats: true, notes: "Technique" }),
      makeExercise({ id: "counted", weight: 70, sortOrder: 1, notes: "Working sets" }),
    ]), "bench");

    expect(session?.excludeFromStats).toBe(false);
    expect(session?.bestE1RM).toBeCloseTo(70 * (1 + 5 / 30));
    expect(session?.notes).toBe("Technique\nWorking sets");
    expect(session?.sets.map((set) => [set.weight, set.excludeFromStats, set.setOrder]))
      .toEqual([[200, true, 0], [70, false, 1]]);
  });

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
