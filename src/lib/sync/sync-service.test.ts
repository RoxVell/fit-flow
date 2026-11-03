import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncRequest, SyncResponse } from "./types";
vi.mock("@/lib/db/seed-loader", () => ({ ensureSeeded: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/hooks/use-exercise-library", () => ({ ensureManifestLoaded: vi.fn().mockResolvedValue([]) }));

const reply = (body: SyncRequest, rejected: SyncResponse["rejected"] = []): SyncResponse => ({
  accepted: rejected.length ? [] : body.changes.map((change) => change.id),
  superseded: [], rejected, serverChanges: [], serverTime: "2026-11-01T00:00:00.000Z",
});

describe("sync runner uploads", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { onLine: true });
    const { db } = await import("@/lib/db/dexie");
    await db.syncQueue.clear();
    await db.meta.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  async function seedPending(count: number) {
    const { db } = await import("@/lib/db/dexie");
    await db.syncQueue.bulkPut(Array.from({ length: count }, (_, index) => ({ id: `q-${index}`, entityId: `w-${index}`,
      entityType: "workoutLog" as const, operation: "delete" as const, revision: 2,
      createdAt: "2026-11-01T00:00:00.000Z", status: "pending" as const })));
    return db;
  }

  it("drains 101 pending changes without credentials, loading config once", async () => {
    const db = await seedPending(101);
    const batches: number[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return Response.json({ enabled: true });
      const body = JSON.parse(String(init.body)) as SyncRequest;
      expect(new Headers(init.headers).has("authorization")).toBe(false);
      batches.push(body.changes.length);
      return Response.json(reply(body));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { sync } = await import("./sync-service");
    await sync();
    expect(batches).toEqual([100, 1]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it("does not POST or consume local changes when the server disables sync", async () => {
    const db = await seedPending(1);
    const fetchMock = vi.fn(async () => Response.json({ enabled: false }));
    vi.stubGlobal("fetch", fetchMock);
    const { sync } = await import("./sync-service");
    await sync();
    await sync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await db.syncQueue.count()).toBe(1);
  });

  it("stops draining on rejected changes instead of immediately retrying the same batch", async () => {
    const db = await seedPending(101);
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return Response.json({ enabled: true });
      const body = JSON.parse(String(init.body)) as SyncRequest;
      return Response.json(reply(body, [{ id: body.changes[0].id, reason: "Temporary database failure" }]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { sync } = await import("./sync-service");
    await sync();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await db.syncQueue.where("status").equals("pending").count()).toBe(101);
  });
});
