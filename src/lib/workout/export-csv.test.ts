import { describe, expect, it } from "vitest";
import type { WorkoutLogEntity } from "@/lib/db/types";
import {
  buildWorkoutLogsCsv,
  createWorkoutExportRange,
  getWorkoutExportFilename,
} from "./export-csv";

function makeLog(): WorkoutLogEntity {
  return {
    id: "log-1",
    startedAt: "2026-06-20T10:00:00.000Z",
    endedAt: "2026-06-20T11:00:00.000Z",
    programName: "Push, Pull",
    sessionName: 'Heavy "Push"',
    notes: "Felt good\nAdd weight next time",
    exercises: [
      {
        id: "logged-ex-1",
        exerciseId: "bench-press",
        exercise: {
          id: "bench-press",
          name: "Bench Press",
          muscleGroup: "chest",
          secondaryMuscles: [],
          equipment: "barbell",
          unilateral: false,
          category: "compound",
          description: "",
        },
        workoutLogId: "log-1",
        sortOrder: 0,
        notes: "Paused reps",
        sets: [
          {
            id: "set-2",
            loggedExerciseId: "logged-ex-1",
            type: "working",
            setOrder: 1,
            weight: 105,
            reps: 3,
            rir: 1,
            completed: true,
          },
          {
            id: "set-1",
            loggedExerciseId: "logged-ex-1",
            type: "warmup",
            setOrder: 0,
            weight: 60,
            reps: 8,
            completed: false,
          },
        ],
      },
    ],
    revision: 1,
    updatedAt: "2026-06-20T11:00:00.000Z",
  };
}

describe("createWorkoutExportRange", () => {
  it("creates an inclusive local-day range for presets", () => {
    const range = createWorkoutExportRange("3m", new Date("2026-06-27T12:30:00"));

    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(2);
    expect(range.from.getDate()).toBe(27);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getHours()).toBe(23);
    expect(range.to.getMinutes()).toBe(59);
  });
});

describe("buildWorkoutLogsCsv", () => {
  it("exports completed workout sets with csv escaping", () => {
    const csv = buildWorkoutLogsCsv([makeLog()]);

    expect(csv).toContain("workout_id,started_at,ended_at");
    expect(csv).toContain('"Push, Pull"');
    expect(csv).toContain('"Heavy ""Push"""');
    expect(csv).toContain("Bench Press,1,working,105,3,1,yes");
    expect(csv).toContain('"Felt good\nAdd weight next time"');
    expect(csv).not.toContain("warmup,60,8");
  });
});

describe("getWorkoutExportFilename", () => {
  it("uses local calendar dates in the file name", () => {
    expect(
      getWorkoutExportFilename({
        from: new Date(2026, 4, 1, 0, 0, 0, 0),
        to: new Date(2026, 5, 27, 23, 59, 59, 999),
      })
    ).toBe("workout-logs-2026-05-01_2026-06-27.csv");
  });
});
