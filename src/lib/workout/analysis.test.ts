import { describe, expect, it } from "vitest";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { buildWorkoutReport } from "./analysis";

const range = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31, 23, 59, 59, 999) };
function log(id: string, day: number, weight: number): WorkoutLogEntity {
  return {
    id, revision: 9, updatedAt: "private-sync-field", notes: "Keep notes as data",
    startedAt: new Date(2026, 0, day, 10).toISOString(),
    endedAt: new Date(2026, 0, day, 11).toISOString(),
    exercises: [{
      id: "ex", exerciseId: "bench", workoutLogId: id, sortOrder: 0,
      sets: [
        { id: "s", loggedExerciseId: "ex", type: "working", setOrder: 1, reps: 6, weight, rir: 2, completed: true },
        { id: "incomplete", loggedExerciseId: "ex", type: "working", setOrder: 0, reps: 6, weight: 999, completed: false },
      ],
    }],
  };
}

describe("workout analysis", () => {
  it("does not mark a complete Monday–Sunday interval as partial", () => {
    const report = buildWorkoutReport([], { from: new Date(2026, 0, 5), to: new Date(2026, 0, 11, 23, 59, 59, 999) });
    expect(report.summary.weeks).toHaveLength(1);
    expect(report.summary.weeks[0].partial).toBe(false);
  });
  it("filters unfinished/deleted/out-of-range workouts and incomplete sets, preserves notes without sync metadata", () => {
    const report = buildWorkoutReport([
      log("last", 30, 60), { ...log("deleted", 10, 999), deletedAt: "deleted" },
      { ...log("draft", 11, 999), endedAt: undefined }, log("outside", 32, 999), log("first", 1, 50),
    ], range);
    expect(report.workouts.map((workout) => workout.id)).toEqual(["first", "last"]);
    expect(report.workouts[0].exercises[0].sets).toHaveLength(1);
    expect(report.workouts[0].exercises[0].sets[0].rir).toBe(2);
    expect(report.workouts[0].notes).toBe("Keep notes as data");
    expect(JSON.stringify(report)).not.toContain("private-sync-field");
    expect(report.summary.sets).toBe(2);
    expect(report.summary.volumeKgReps).toBe(660);
    expect(report.summary.exercises[0].bestEstimated1RMKg).toBe(72);
    expect(report.summary.exercises[0].estimated1RMChangePercent).toBe(20);
    expect(report.summary.weeks.some((week) => week.workouts === 0)).toBe(true);
    expect(report.summary.weeks[0].partial).toBe(true);
  });

  it("retains excluded entries in raw data while excluding them from every summary metric", () => {
    const excluded = log("excluded", 15, 999);
    excluded.exercises[0].excludeFromStats = true;
    const report = buildWorkoutReport([log("first", 1, 50), excluded], range);
    expect(report.workouts[1].exercises[0].excludeFromStats).toBe(true);
    expect(report.summary.workoutCount).toBe(2);
    expect(report.summary.excludedExerciseEntries).toBe(1);
    expect(report.summary.volumeKgReps).toBe(300);
    expect(report.summary.exercises[0].estimated1RMChangePercent).toBeNull();
  });

  it("does not invent strength change for bodyweight-only or empty histories", () => {
    const report = buildWorkoutReport([log("first", 1, 0), log("last", 30, 0)], range);
    expect(report.summary.exercises[0].bestEstimated1RMKg).toBeNull();
    expect(report.summary.exercises[0].estimated1RMChangePercent).toBeNull();
    const empty = buildWorkoutReport([], range);
    expect(empty.summary.workoutCount).toBe(0);
    expect(empty.summary.exercises).toEqual([]);
    expect(empty.summary.weeks.every((week) => week.workouts === 0)).toBe(true);
  });

  it("merges repeated exercise entries per workout and keeps all completed set types", () => {
    const workout = log("first", 1, 50);
    workout.exercises.push({ ...workout.exercises[0], sets: [{ ...workout.exercises[0].sets[0], type: "warmup", weight: 20 }] });
    const report = buildWorkoutReport([workout], range);
    expect(report.summary.exercises[0].history).toHaveLength(1);
    expect(report.summary.exercises[0].history[0].sets).toBe(2);
    expect(report.summary.volumeKgReps).toBe(420);
    expect(report.summary.exercises[0].estimated1RMChangePercent).toBeNull();
  });
});
