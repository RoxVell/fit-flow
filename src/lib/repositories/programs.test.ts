import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import { DEFAULT_REST_DURATION_SECONDS } from "@/lib/workout/rest-duration";
import { createProgram, getProgramById, updateProgram } from "./programs";

vi.mock("@/lib/repositories/exercises", () => ({
  attachExercisesToSessions: <T>(sessions: T) => sessions,
  getExerciseMap: vi.fn().mockResolvedValue(new Map()),
}));

const SESSION = {
  name: "Push",
  dayOfWeek: 1,
  sortOrder: 0,
  exercises: [
    {
      exerciseId: "ex-bench",
      targetSets: 3,
      targetReps: "8-12",
      sortOrder: 0,
    },
  ],
};

async function resetPrograms() {
  await Promise.all([db.programs.clear(), db.syncQueue.clear()]);
}

describe("programs repository", () => {
  beforeEach(async () => {
    await resetPrograms();
  });

  it("persists restDurationSeconds on create", async () => {
    const created = await createProgram({
      name: "Test Program",
      description: "Rest timer test",
      daysPerWeek: 1,
      isActive: true,
      restDurationSeconds: 120,
      sessions: [SESSION],
    });

    expect(created.restDurationSeconds).toBe(120);

    const loaded = await getProgramById(created.id);
    expect(loaded?.restDurationSeconds).toBe(120);
  });

  it("updates restDurationSeconds on save", async () => {
    const created = await createProgram({
      name: "Test Program",
      description: "",
      daysPerWeek: 1,
      isActive: true,
      restDurationSeconds: DEFAULT_REST_DURATION_SECONDS,
      sessions: [SESSION],
    });

    const updated = await updateProgram(created.id, {
      name: "Test Program",
      description: "",
      daysPerWeek: 1,
      isActive: true,
      restDurationSeconds: 45,
      sessions: [SESSION],
    });

    expect(updated?.restDurationSeconds).toBe(45);
  });
});
