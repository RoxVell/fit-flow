import { beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb }));
vi.mock("./db/seed", () => ({ ensureServerSeeded: vi.fn().mockResolvedValue(undefined) }));
import { buildUpsert, handleSync, toServerChanges } from "./sync";

describe("server sync contract", () => {
  beforeEach(() => getDb.mockReset());

  it("compares revisions in the same SQL statement that writes, preserving createdAt", () => {
    getDb.mockReturnValue(drizzle.mock({ schema }));
    const query = buildUpsert(schema.programs, { id: "p", name: "PPL", daysPerWeek: 3,
      createdAt: "2026-01-01T00:00:00Z", revision: 7, restDurationSeconds: 150 }, 7).toSQL();
    expect(query.sql).toContain('on conflict ("id") do update set');
    expect(query.sql).toMatch(/where "programs"\."revision" < \$\d+ returning/);
    expect(query.sql.split("do update set")[1]).not.toContain('"created_at" =');
    expect(query.params.at(-1)).toBe(7);
    expect(query.params).toContain(150);
  });

  it("round-trips rest duration and nested values, omitting only SQL nulls", () => {
    const row = { id: "p", revision: 2, updatedAt: "2026-01-01 00:00:00+00", deletedAt: null, restDurationSeconds: 150, sessions: [{ id: "s", exercises: [] }] };
    expect(toServerChanges("program", [row])).toEqual([{ entityType: "program", revision: 2,
      entity: { id: "p", revision: 2, updatedAt: "2026-01-01T00:00:00.000Z", restDurationSeconds: 150, sessions: row.sessions } }]);
  });

  it("preserves stored payload when a delete updates an existing row", () => {
    getDb.mockReturnValue(drizzle.mock({ schema }));
    const query = buildUpsert(schema.workoutLogs, { id: "w", startedAt: "2026-01-01T00:00:00Z", exercises: [],
      deletedAt: "2026-01-01T01:00:00Z", updatedAt: "2026-01-01T01:00:00Z", revision: 3 }, 3).toSQL();
    const update = query.sql.split("do update set")[1];
    expect(update).toContain('"deleted_at" =');
    expect(update).not.toContain('"exercises" =');
    expect(update).not.toContain('"started_at" =');
    expect(update).toMatch(/where "workout_logs"\."revision" < \$\d+/);
  });

  it("normalizes PostgreSQL timestamps to ISO for IndexedDB sorting and date-range comparisons", () => {
    const postgres = "2026-11-01 15:30:00+03";
    const change = toServerChanges("workoutLog", [{ revision: 1, ...Object.fromEntries(
      ["createdAt", "startedAt", "endedAt", "date", "updatedAt", "deletedAt"].map((key) => [key, postgres])
    ) }])[0];
    const entity = change.entity as Record<string, unknown>;
    for (const key of ["createdAt", "startedAt", "endedAt", "date", "updatedAt", "deletedAt"]) {
      expect(entity[key]).toBe("2026-11-01T12:30:00.000Z");
    }
    expect(String(entity.startedAt) > "2026-11-01T12:00:00.000Z").toBe(true);
  });

  it("pulls delayed writes on the next sync even when their timestamps precede the prior response", async () => {
    const logs: { id: string; revision: number; updatedAt: string; deletedAt?: string }[] = [];
    const from = vi.fn((table) => Promise.resolve(table === schema.workoutLogs ? [...logs] : []));
    getDb.mockReturnValue({ select: () => ({ from }) });
    const first = await handleSync([]);
    logs.push({ id: "late", revision: 1, updatedAt: "2020-01-01T00:00:00Z" });
    logs.push({ id: "deleted", revision: 3, updatedAt: "2020-01-02T00:00:00Z", deletedAt: "2020-01-02T00:00:00Z" });
    const second = await handleSync([]);
    expect(first.serverChanges).toEqual([]);
    expect(second.serverChanges.map((change) => (change.entity as { id: string }).id)).toEqual(["late", "deleted"]);
    expect(from).toHaveBeenCalledTimes(8);
  });

  it("keeps transient database failures retryable and reports stale writes as superseded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const returning = vi.fn().mockRejectedValueOnce(new Error("network unavailable")).mockResolvedValueOnce([]);
    getDb.mockReturnValue({ insert: () => ({ values: () => ({ onConflictDoUpdate: () => ({ returning }) }) }),
      select: () => ({ from: async () => [] }) });
    const result = await handleSync([
      { id: "retry", entityId: "w1", entityType: "workoutLog", operation: "delete", revision: 2 },
      { id: "stale", entityId: "w2", entityType: "workoutLog", operation: "delete", revision: 2 },
    ]);
    expect(result.superseded).toEqual(["stale"]);
    expect(result.rejected).toEqual([{ id: "retry", reason: "Unable to save change; will retry" }]);
    vi.restoreAllMocks();
  });
});
