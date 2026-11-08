import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncRequest, SyncResponse } from "./types";
vi.mock("@/lib/db/seed-loader", () => ({ ensureSeeded: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/hooks/use-exercise-library", () => ({ ensureManifestLoaded: vi.fn().mockResolvedValue([]) }));

const reply = (body: SyncRequest, rejected: SyncResponse["rejected"] = []): SyncResponse => ({
  accepted: rejected.length ? [] : body.changes.map((change) => change.id),
  superseded: [], rejected, serverChanges: [], serverTime: "2026-11-01T00:00:00.000Z",
});

describe("sync runner uploads", () => {
  let stopRunner: (() => void) | undefined;
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { onLine: true });
    const { db } = await import("@/lib/db/dexie");
    await db.syncQueue.clear();
    await db.meta.clear();
  });
  afterEach(() => {
    stopRunner?.();
    stopRunner = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mockRunnerEnvironment() {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    vi.stubGlobal("window", Object.assign(new EventTarget(), { setInterval, clearInterval }));
    const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
    vi.stubGlobal("document", document);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    return document;
  }

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

  it.each(["http", "network"])("recovers from an initial %s config failure without user action", async (failure) => {
    const db = await seedPending(1);
    mockRunnerEnvironment();
    let configRequests = 0;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") {
        if (++configRequests === 1) {
          if (failure === "network") throw new TypeError("Failed to fetch");
          return new Response(null, { status: 503 });
        }
        return Response.json({ enabled: true });
      }
      return Response.json(reply(JSON.parse(String(init.body)) as SyncRequest));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { startSyncRunner } = await import("./sync-service");
    stopRunner = startSyncRunner();
    await vi.waitFor(() => expect(configRequests).toBe(1));
    expect(await db.syncQueue.count()).toBe(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(async () => expect(await db.syncQueue.count()).toBe(0));
    expect(configRequests).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps periodic attempts disabled when the server explicitly disables sync", async () => {
    const db = await seedPending(1);
    mockRunnerEnvironment();
    const fetchMock = vi.fn(async () => Response.json({ enabled: false }));
    vi.stubGlobal("fetch", fetchMock);
    const { startSyncRunner } = await import("./sync-service");
    stopRunner = startSyncRunner();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(180_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await db.syncQueue.count()).toBe(1);
  });

  it("defers config retries while hidden and recovers when the app becomes visible", async () => {
    const db = await seedPending(1);
    const document = mockRunnerEnvironment();
    let configRequests = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") {
        return ++configRequests === 1
          ? new Response(null, { status: 503 })
          : Response.json({ enabled: true });
      }
      return Response.json(reply(JSON.parse(String(init.body)) as SyncRequest));
    }));
    const { startSyncRunner } = await import("./sync-service");
    stopRunner = startSyncRunner();
    await vi.waitFor(() => expect(configRequests).toBe(1));
    document.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(120_000);
    expect(configRequests).toBe(1);
    expect(await db.syncQueue.count()).toBe(1);

    document.visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(async () => expect(await db.syncQueue.count()).toBe(0));
    expect(configRequests).toBe(2);
  });

  it("retries a failed upload in the background without discarding local changes", async () => {
    const db = await seedPending(1);
    mockRunnerEnvironment();
    let uploads = 0;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method !== "POST") return Response.json({ enabled: true });
      if (++uploads === 1) return new Response(null, { status: 503 });
      return Response.json(reply(JSON.parse(String(init.body)) as SyncRequest));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { startSyncRunner } = await import("./sync-service");
    stopRunner = startSyncRunner();
    await vi.waitFor(() => expect(uploads).toBe(1));
    expect(await db.syncQueue.count()).toBe(1);

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.waitFor(async () => expect(await db.syncQueue.count()).toBe(0));
    expect(uploads).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
