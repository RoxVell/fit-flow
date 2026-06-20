import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import { DEFAULT_REST_DURATION_SECONDS } from "@/lib/workout/rest-duration";
import {
  createProgram,
  getProgramById,
  setActiveProgram,
  updateProgram,
} from "./programs";

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

const PROGRAM_BASE = {
  description: "",
  daysPerWeek: 1,
  restDurationSeconds: DEFAULT_REST_DURATION_SECONDS,
  sessions: [SESSION],
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
      ...PROGRAM_BASE,
      name: "Test Program",
      description: "Rest timer test",
      restDurationSeconds: 120,
    });

    expect(created.restDurationSeconds).toBe(120);

    const loaded = await getProgramById(created.id);
    expect(loaded?.restDurationSeconds).toBe(120);
  });

  it("updates restDurationSeconds on save", async () => {
    const created = await createProgram({
      ...PROGRAM_BASE,
      name: "Test Program",
    });

    const updated = await updateProgram(created.id, {
      ...PROGRAM_BASE,
      name: "Test Program",
      restDurationSeconds: 45,
    });

    expect(updated?.restDurationSeconds).toBe(45);
  });

  it("auto-activates the first created program", async () => {
    const created = await createProgram({
      ...PROGRAM_BASE,
      name: "First Program",
    });

    expect(created.isActive).toBe(true);
  });

  it("keeps later programs inactive until explicitly activated", async () => {
    await createProgram({ ...PROGRAM_BASE, name: "First Program" });
    const second = await createProgram({ ...PROGRAM_BASE, name: "Second Program" });

    expect(second.isActive).toBe(false);
  });

  it("setActiveProgram switches the active program", async () => {
    const first = await createProgram({ ...PROGRAM_BASE, name: "First Program" });
    const second = await createProgram({ ...PROGRAM_BASE, name: "Second Program" });

    await setActiveProgram(second.id);

    expect((await getProgramById(first.id))?.isActive).toBe(false);
    expect((await getProgramById(second.id))?.isActive).toBe(true);
  });

  it("updateProgram preserves isActive", async () => {
    const created = await createProgram({ ...PROGRAM_BASE, name: "Active Program" });

    const updated = await updateProgram(created.id, {
      ...PROGRAM_BASE,
      name: "Renamed Program",
      isActive: false,
    });

    expect(updated?.isActive).toBe(true);
  });
});
