import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/dexie";
import type {
  Exercise,
  LoggedExercise,
  PersonalRecordEntity,
  WorkoutLogEntity,
} from "@/lib/db/types";
import {
  createPRsFromWorkout,
  deletePersonalRecordsForWorkout,
  reconcilePRsAfterWorkoutUpdate,
} from "./records";

const EXERCISE_ID = "ex-bench";
const COMPLETED_AT = "2026-06-20T12:00:00.000Z";

function makeExercise(): Exercise {
  return {
    id: EXERCISE_ID,
    name: "Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: [],
    equipment: "barbell",
    unilateral: false,
    category: "compound",
    description: "",
  };
}

function makeLoggedExercise(
  weight: number,
  reps: number,
  id = "le-1"
): LoggedExercise {
  return {
    id,
    exerciseId: EXERCISE_ID,
    workoutLogId: "log-1",
    sortOrder: 0,
    sets: [
      {
        id: "set-1",
        loggedExerciseId: id,
        type: "working",
        setOrder: 0,
        weight,
        reps,
        completed: true,
      },
    ],
  };
}

function makeWorkoutLog(
  exercises: LoggedExercise[],
  id = "log-1"
): WorkoutLogEntity {
  const now = COMPLETED_AT;
  return {
    id,
    startedAt: now,
    endedAt: now,
    sessionName: "Push",
    exercises,
    revision: 1,
    updatedAt: now,
  };
}

async function resetDb() {
  await Promise.all([
    db.personalRecords.clear(),
    db.workoutLogs.clear(),
    db.syncQueue.clear(),
  ]);
}

async function seedPersonalRecord(
  partial: Partial<PersonalRecordEntity> & Pick<PersonalRecordEntity, "id">
): Promise<PersonalRecordEntity> {
  const now = COMPLETED_AT;
  const entity: PersonalRecordEntity = {
    exerciseId: EXERCISE_ID,
    exerciseName: "Bench Press",
    type: "weight",
    value: 80,
    date: COMPLETED_AT,
    revision: 1,
    updatedAt: now,
    ...partial,
  };
  await db.personalRecords.put(entity);
  return entity;
}

describe("createPRsFromWorkout", () => {
  const exerciseMap = new Map([[EXERCISE_ID, makeExercise()]]);

  it("emits weight, volume, and e1RM PRs when values exceed prior records", () => {
    const records = createPRsFromWorkout(
      [makeLoggedExercise(100, 5)],
      exerciseMap,
      COMPLETED_AT,
      []
    );

    expect(records).toHaveLength(3);
    expect(records.map((r) => r.type).sort()).toEqual([
      "estimated_1rm",
      "volume",
      "weight",
    ]);
    expect(records.find((r) => r.type === "weight")?.value).toBe(100);
    expect(records.find((r) => r.type === "volume")?.value).toBe(500);
  });

  it("skips PR types that do not beat existing records", () => {
    const existing = [
      {
        id: "pr-old",
        exerciseId: EXERCISE_ID,
        exerciseName: "Bench Press",
        type: "weight" as const,
        value: 100,
        date: "2026-06-01T12:00:00.000Z",
      },
    ];

    const records = createPRsFromWorkout(
      [makeLoggedExercise(90, 8)],
      exerciseMap,
      COMPLETED_AT,
      existing
    );

    expect(records.find((r) => r.type === "weight")).toBeUndefined();
    expect(records.some((r) => r.type === "volume")).toBe(true);
  });

  it("ignores exercises missing from the exercise map", () => {
    const records = createPRsFromWorkout(
      [makeLoggedExercise(100, 5, "le-unknown")],
      new Map(),
      COMPLETED_AT,
      []
    );

    expect(records).toHaveLength(0);
  });
});

describe("deletePersonalRecordsForWorkout", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("soft-deletes PRs linked by workoutLogId", async () => {
    await seedPersonalRecord({
      id: "pr-linked",
      workoutLogId: "log-1",
      type: "weight",
      value: 100,
    });

    await deletePersonalRecordsForWorkout("log-1");

    const stored = await db.personalRecords.get("pr-linked");
    expect(stored?.deletedAt).toBeTruthy();
  });

  it("soft-deletes legacy PRs matched by date and metric values", async () => {
    const log = makeWorkoutLog([makeLoggedExercise(100, 5)]);
    await seedPersonalRecord({
      id: "pr-legacy",
      type: "weight",
      value: 100,
      date: COMPLETED_AT,
    });

    await deletePersonalRecordsForWorkout(
      log.id,
      log,
      new Map([[EXERCISE_ID, makeExercise()]])
    );

    const stored = await db.personalRecords.get("pr-legacy");
    expect(stored?.deletedAt).toBeTruthy();
  });
});

describe("reconcilePRsAfterWorkoutUpdate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("removes old PRs and creates new ones when edited values qualify", async () => {
    const exerciseMap = new Map([[EXERCISE_ID, makeExercise()]]);
    const log = makeWorkoutLog([makeLoggedExercise(100, 5)]);

    await seedPersonalRecord({
      id: "pr-old",
      workoutLogId: log.id,
      type: "weight",
      value: 100,
    });

    const updatedLog: WorkoutLogEntity = {
      ...log,
      exercises: [makeLoggedExercise(110, 5)],
    };

    const created = await reconcilePRsAfterWorkoutUpdate(updatedLog, exerciseMap);

    const old = await db.personalRecords.get("pr-old");
    expect(old?.deletedAt).toBeTruthy();

    const active = (await db.personalRecords.toArray()).filter((r) => !r.deletedAt);
    expect(active.some((r) => r.workoutLogId === log.id && r.type === "weight")).toBe(
      true
    );
    expect(created.some((r) => r.type === "weight" && r.value === 110)).toBe(true);
  });

  it("does not recreate PRs when edited values no longer beat remaining records", async () => {
    const exerciseMap = new Map([[EXERCISE_ID, makeExercise()]]);
    const log = makeWorkoutLog([makeLoggedExercise(100, 5)]);

    await seedPersonalRecord({
      id: "pr-workout",
      workoutLogId: log.id,
      type: "weight",
      value: 100,
    });
    await seedPersonalRecord({
      id: "pr-other",
      type: "weight",
      value: 120,
      date: "2026-06-21T12:00:00.000Z",
    });

    const updatedLog: WorkoutLogEntity = {
      ...log,
      exercises: [makeLoggedExercise(90, 5)],
    };

    const created = await reconcilePRsAfterWorkoutUpdate(updatedLog, exerciseMap);

    const active = (await db.personalRecords.toArray()).filter((r) => !r.deletedAt);
    expect(
      active.some((r) => r.workoutLogId === log.id && r.type === "weight")
    ).toBe(false);
    expect(created.some((r) => r.type === "weight")).toBe(false);
  });
});
