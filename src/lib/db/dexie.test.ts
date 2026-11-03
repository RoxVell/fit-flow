import Dexie from "dexie";
import { expect, it } from "vitest";
import { FitFlowDB } from "./dexie";
import { buildLoggedExercisesFromSession } from "@/lib/workout/start-session-draft";

it("upgrades a legacy database without clearing history, drafts, programs or archived PRs", async () => {
  const name = "fitflow-migration-test";
  await Dexie.delete(name);
  const legacy = new Dexie(name);
  legacy.version(2).stores({
    exercises: "id", programs: "id, isActive, updatedAt", workoutLogs: "id, startedAt, updatedAt",
    bodyMeasurements: "id, date, updatedAt", cardioSessions: "id, date, updatedAt",
    personalRecords: "id, exerciseId, updatedAt", syncQueue: "id, entityId, status, createdAt",
    workoutDrafts: "id", meta: "key", exerciseReplacements: "[fromExerciseId+toExerciseId], fromExerciseId",
  });
  const date = "2026-06-01T12:00:00.000Z";
  const exercise = { id: "old-bench", name: "Legacy bench", muscleGroup: "chest" };
  const entries = [{ id: "entry", exerciseId: exercise.id, sets: [] }];
  await legacy.table("exercises").put(exercise);
  await legacy.table("workoutLogs").put({ id: "log", startedAt: date, endedAt: date, exercises: entries, revision: 2, updatedAt: date });
  await legacy.table("programs").put({ id: "program", sessions: [{ exercises: entries }], revision: 1, updatedAt: date });
  await legacy.table("workoutDrafts").put({ id: "active", activeWorkoutId: "session", sessionId: "session", exercises: entries });
  await legacy.table("personalRecords").put({ id: "standalone-pr", value: 90 });
  await legacy.table("meta").put({ key: "app", schemaVersion: 1 });
  await legacy.table("syncQueue").bulkPut([
    { id: "obsolete", entityType: "personalRecord", status: "pending" },
    { id: "kept", entityType: "bodyMeasurement", status: "pending" },
  ]);
  legacy.close();

  const upgraded = new FitFlowDB(name);
  try {
    await upgraded.open();
    expect(await upgraded.workoutLogs.count()).toBe(1);
    expect((await upgraded.workoutLogs.get("log"))?.exercises[0].exercise).toMatchObject(exercise);
    expect((await upgraded.programs.get("program"))?.sessions[0].exercises[0].exercise).toMatchObject(exercise);
    expect((await upgraded.workoutDrafts.get("active"))?.exercises[0].exercise).toMatchObject(exercise);
    expect((await upgraded.workoutDrafts.get("active"))?.activeWorkoutId).not.toBe("session");
    const session = (await upgraded.programs.get("program"))!.sessions[0];
    expect(buildLoggedExercisesFromSession(session)[0].exercise).toMatchObject(exercise);
    expect(await upgraded.table("personalRecords").get("standalone-pr")).toMatchObject({ value: 90 });
    expect(upgraded.tables.some((table) => table.name === "exercises")).toBe(false);
    expect(await upgraded.syncQueue.get("obsolete")).toBeUndefined();
    expect(await upgraded.syncQueue.get("kept")).toBeDefined();
    expect(await upgraded.syncQueue.filter((entry) => entry.entityType === "workoutLog").count()).toBe(1);
  } finally {
    upgraded.close();
    await Dexie.delete(name);
  }
});
