import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import type { WorkoutLogEntity } from "@/lib/db/types";
import { applyServerChanges } from "./apply-server-changes";
import { enqueueSync, getPending, markFailed } from "./queue";

const log: WorkoutLogEntity = { id: "log", startedAt: "2026-01-01T00:00:00Z", exercises: [], revision: 2, updatedAt: "2026-01-01T01:00:00Z" };

describe("full pull application", () => {
  beforeEach(async () => { await db.workoutLogs.clear(); await db.syncQueue.clear(); });

  it("does not rewrite unchanged rows or overwrite a newer local edit", async () => {
    await db.workoutLogs.put(log);
    const put = vi.spyOn(db.workoutLogs, "put");
    await applyServerChanges([{ entityType: "workoutLog", revision: 2, entity: log }]);
    await applyServerChanges([{ entityType: "workoutLog", revision: 1, entity: { ...log, revision: 1, exercises: [] } }]);
    expect(put).not.toHaveBeenCalled();
    put.mockRestore();
  });

  it("applies tombstones but does not resurrect a pending local delete", async () => {
    await db.workoutLogs.put(log);
    await applyServerChanges([{ entityType: "workoutLog", revision: 3, entity: { ...log, revision: 3, deletedAt: log.updatedAt } }]);
    expect(await db.workoutLogs.get(log.id)).toBeUndefined();
    await enqueueSync({ entityType: "workoutLog", entityId: log.id, operation: "delete", revision: 4 });
    await applyServerChanges([{ entityType: "workoutLog", revision: 2, entity: log }]);
    expect(await db.workoutLogs.get(log.id)).toBeUndefined();
  });

  it("still accepts the server winner if equal revision/timestamp fields conceal a conflict", async () => {
    await db.workoutLogs.put({ ...log, notes: "local" });
    await applyServerChanges([{ entityType: "workoutLog", revision: log.revision, entity: { ...log, notes: "server" } }]);
    expect((await db.workoutLogs.get(log.id))?.notes).toBe("server");
  });

  it("removes permanent rejects from retries and replaces them on a new edit", async () => {
    await enqueueSync({ entityType: "workoutLog", entityId: log.id, operation: "update", revision: 2, payload: log });
    const [entry] = await getPending();
    await markFailed([entry.id]);
    expect(await getPending()).toEqual([]);
    expect((await db.syncQueue.get(entry.id))?.status).toBe("failed");
    await enqueueSync({ entityType: "workoutLog", entityId: log.id, operation: "update", revision: 3, payload: { ...log, revision: 3 } });
    expect(await db.syncQueue.count()).toBe(1);
    expect((await getPending())[0].revision).toBe(3);
  });
});
