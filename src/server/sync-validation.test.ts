import { describe, expect, it } from "vitest";
import { parseSyncRequest } from "./sync-validation";

const programChange = () => ({
  id: "change-1", entityType: "program", entityId: "program-1", revision: 2, operation: "update",
  payload: { id: "program-1", name: "PPL", description: "", daysPerWeek: 3, isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z", restDurationSeconds: 150, sessions: [] },
});

describe("sync request validation", () => {
  it("keeps rest duration and accepts the old cursor without depending on it", () => {
    const change = programChange();
    expect(parseSyncRequest({ lastPullAt: "2026-11-01T00:00:00.000Z", changes: [change] }))
      .toEqual({ changes: [change], superseded: [], rejected: [] });
  });

  it("retires obsolete queue entries without blocking current changes", () => {
    const current = programChange();
    const result = parseSyncRequest({ changes: [
      { id: "old-ex", entityType: "exercise" }, { id: "old-pr", entityType: "personalRecord" }, current,
    ] });
    expect(result.changes).toEqual([current]);
    expect(result.superseded).toEqual(["old-ex", "old-pr"]);
  });

  it("rejects mismatched IDs and malformed revisions individually", () => {
    const mismatch = programChange();
    mismatch.payload.id = "someone-else";
    const result = parseSyncRequest({ changes: [mismatch, { ...programChange(), id: "bad-revision", revision: 1.5 }, programChange()] });
    expect(result.changes).toHaveLength(1);
    expect(result.rejected).toEqual([
      { id: "change-1", reason: "Invalid change payload", permanent: true },
      { id: "bad-revision", reason: "Invalid change payload", permanent: true },
    ]);
  });

  it("rejects malformed nested workout sets, not just the envelope", () => {
    const result = parseSyncRequest({ changes: [{ id: "bad-set", entityType: "workoutLog", entityId: "log-1", revision: 1, operation: "create",
      payload: { id: "log-1", startedAt: "2026-11-01T12:00:00.000Z", exercises: [
        { id: "ex-1", exerciseId: "bench", sortOrder: 0, sets: [{ id: "set-1", setOrder: 0, type: "working", completed: true, reps: 5, weight: "heavy" }] },
      ] },
    }] });
    expect(result.rejected[0]).toMatchObject({ id: "bad-set", permanent: true });
  });

  it("rejects an invalid request before processing any changes", () => {
    expect(() => parseSyncRequest({ changes: "not-an-array" })).toThrow();
    expect(() => parseSyncRequest({ changes: [{}] })).toThrow();
  });
});
