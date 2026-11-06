import { describe, expect, it } from "vitest";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { derivePersonalRecords } from "./personal-records";

function workout(id: string, weight: number, day: number): WorkoutLogEntity {
  const date = `2026-06-${String(day).padStart(2, "0")}T12:00:00.000Z`;
  return { id, startedAt: date, endedAt: date, revision: 1, updatedAt: date,
    exercises: [{ id: `${id}-bench`, exerciseId: "bench", workoutLogId: id, sortOrder: 0,
      sets: [{ id: `${id}-set`, loggedExerciseId: `${id}-bench`, type: "working",
        setOrder: 0, weight, reps: 5, completed: true }] }] };
}

const weightRecords = (logs: WorkoutLogEntity[]) =>
  derivePersonalRecords(logs, new Map()).filter((record) => record.type === "weight");

describe("derived personal records", () => {
  it("restores the remaining best after deleting the record workout", () => {
    const first = workout("first", 100, 1);
    const second = workout("second", 90, 2);
    expect(weightRecords([first, second]).map((record) => record.value)).toEqual([100]);
    expect(weightRecords([{ ...first, deletedAt: first.endedAt }, second])
      .map((record) => record.value)).toEqual([90]);
  });

  it("rebuilds later record events when an earlier workout is edited", () => {
    expect(weightRecords([workout("later", 90, 2), workout("edited", 80, 1)])
      .map((record) => [record.workoutLogId, record.value])).toEqual([["edited", 80], ["later", 90]]);
  });

  it("combines duplicate exercises, excluding unfinished and excluded sets", () => {
    const log = workout("combined", 50, 1);
    log.exercises.push(workout("second", 70, 1).exercises[0]);
    log.exercises.push({ ...workout("excluded", 200, 1).exercises[0], excludeFromStats: true });
    log.exercises[0].sets.push({ ...log.exercises[0].sets[0], id: "unfinished", weight: 500, completed: false });
    const records = derivePersonalRecords([log], new Map());
    expect(records.find((record) => record.type === "weight")?.value).toBe(70);
    expect(records.find((record) => record.type === "volume")?.value).toBe(600);
  });

  it("ignores unfinished workouts and produces stable IDs for unknown exercises", () => {
    const log = workout("legacy", 100, 1);
    expect(weightRecords([{ ...log, endedAt: undefined }])).toEqual([]);
    expect(weightRecords([log])).toEqual(weightRecords([log]));
    expect(weightRecords([log])[0].exerciseName).toBe("bench");
  });
});
