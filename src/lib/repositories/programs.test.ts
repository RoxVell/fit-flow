import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureManifestLoaded } from "@/lib/exercises/library-client";
import { db } from "@/lib/db/dexie";
import { DEFAULT_REST_DURATION_SECONDS } from "@/lib/workout/rest-duration";
import {
  createProgram,
  getProgramById,
  setActiveProgram,
  updateProgram,
  replaceExerciseInProgram,
} from "./programs";

vi.mock("@/lib/exercises/library-client", () => ({
  ensureManifestLoaded: vi.fn().mockResolvedValue([]),
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

describe("programs repository", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await Promise.all([db.programs.clear(), db.syncQueue.clear()]);
  });

  it("persists changes to rest duration and preserves activation and template IDs on edit", async () => {
    const created = await createProgram({ ...PROGRAM_BASE, name: "Test", restDurationSeconds: 120 });
    expect((await getProgramById(created.id))?.restDurationSeconds).toBe(120);

    await updateProgram(created.id, {
      ...created, name: "Renamed", restDurationSeconds: 45, isActive: false,
    });
    const updated = await getProgramById(created.id);
    expect(updated).toMatchObject({
      name: "Renamed", restDurationSeconds: 45, isActive: true,
      sessions: created.sessions, revision: created.revision + 1,
    });
  });

  it("returns the saved program when the optional exercise catalog cannot load", async () => {
    vi.mocked(ensureManifestLoaded).mockRejectedValueOnce(new TypeError("offline"));
    const saved = await createProgram({ ...PROGRAM_BASE, name: "Offline" });
    expect(saved.sessions[0].exercises[0].exerciseId).toBe("ex-bench");
    expect(await db.programs.get(saved.id)).toMatchObject({ name: "Offline" });
    expect(await db.syncQueue.count()).toBe(1);
  });

  it("creates only one active program even when two tabs create simultaneously", async () => {
    const programs = await Promise.all(["First", "Second"].map((name) =>
      createProgram({ ...PROGRAM_BASE, name })
    ));
    expect(programs.filter((p) => p.isActive)).toHaveLength(1);
    const inactive = programs.find((p) => !p.isActive)!;
    await setActiveProgram(inactive.id);
    expect((await db.programs.toArray()).filter((p) => p.isActive).map((p) => p.id))
      .toEqual([inactive.id]);

    const newest = await createProgram({ ...PROGRAM_BASE, name: "Third", isActive: true });
    expect((await db.programs.toArray()).filter((p) => p.isActive).map((p) => p.id))
      .toEqual([newest.id]);
  });

  it("rolls back deactivation if the new active program cannot be queued", async () => {
    const first = await createProgram({ ...PROGRAM_BASE, name: "First" });
    const second = await createProgram({ ...PROGRAM_BASE, name: "Second" });
    vi.spyOn(db.syncQueue, "add")
      .mockResolvedValueOnce("queued")
      .mockRejectedValueOnce(new Error("storage full"));
    await expect(setActiveProgram(second.id)).rejects.toThrow("storage full");
    expect(await db.programs.get(first.id)).toEqual(first);
    expect(await db.programs.get(second.id)).toEqual(second);
  });

  it("replaces every matching template while preserving session IDs, targets and other programs", async () => {
    const created = await createProgram({
      ...PROGRAM_BASE, name: "Target", sessions: [SESSION, { ...SESSION, name: "Push B", sortOrder: 1 }],
    });
    const other = await createProgram({ ...PROGRAM_BASE, name: "Other" });
    await db.syncQueue.clear();

    await replaceExerciseInProgram(created.id, "ex-bench", "ex-incline");

    const stored = await db.programs.get(created.id);
    expect(stored?.sessions).toEqual(created.sessions.map((s) => ({
      ...s, exercises: s.exercises.map((e) => ({ ...e, exerciseId: "ex-incline", exercise: undefined })),
    })));
    expect(stored?.revision).toBe(created.revision + 1);
    expect((await db.programs.get(other.id))?.sessions).toEqual(other.sessions);
    const queued = await db.syncQueue.toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ entityType: "program", entityId: created.id, payload: stored });

    await replaceExerciseInProgram(created.id, "ex-bench", "ex-incline");
    expect(await db.syncQueue.count()).toBe(1);
  });

  it("does not revive a deleted program", async () => {
    const created = await createProgram({ ...PROGRAM_BASE, name: "Deleted" });
    await db.programs.update(created.id, { deletedAt: new Date().toISOString() });
    await expect(replaceExerciseInProgram(created.id, "ex-bench", "ex-incline")).rejects.toThrow();
    expect((await db.programs.get(created.id))?.sessions).toEqual(created.sessions);
  });
});
