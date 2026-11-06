import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { handleSync } = vi.hoisted(() => ({ handleSync: vi.fn() }));
vi.mock("@/server/sync", () => ({ handleSync }));
import { GET, POST } from "@/app/api/sync/route";

const request = (body: unknown = { changes: [] }) =>
  new Request("https://fitflow.example/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("sync API boundary", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://unused.invalid/test");
    handleSync.mockReset().mockResolvedValue({ accepted: [], superseded: [], rejected: [], serverChanges: [], serverTime: "2026-11-01T00:00:00.000Z" });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reports disabled with no database and never invokes sync", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(await GET().json()).toEqual({ enabled: false });
    expect((await POST(request())).status).toBe(503);
    expect(handleSync).not.toHaveBeenCalled();
  });

  it.each(["production", "development"])("syncs without credentials on a public URL in %s", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    expect(await GET().json()).toEqual({ enabled: true });
    expect((await POST(request())).status).toBe(200);
    expect(handleSync).toHaveBeenCalledWith([]);
  });

  it("returns invalid input as a client error and retires obsolete changes", async () => {
    expect((await POST(request({ changes: "invalid" }))).status).toBe(400);
    expect(handleSync).not.toHaveBeenCalled();
    const response = await POST(request({ changes: [
      { id: "old", entityType: "personalRecord" },
      { id: "bad", entityType: "program", entityId: "p", operation: "update", revision: 2, payload: {} },
    ] }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ superseded: ["old"], rejected: [{ id: "bad", permanent: true }] });
    expect(handleSync).toHaveBeenCalledWith([]);
  });
});
