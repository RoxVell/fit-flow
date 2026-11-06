import { afterEach, expect, it, vi } from "vitest";
afterEach(() => vi.unstubAllEnvs());

it("imports the server database module without DATABASE_URL", async () => {
  vi.stubEnv("DATABASE_URL", "");
  const { getDb } = await import("./index");
  expect(getDb).toBeTypeOf("function");
  expect(() => getDb()).toThrow("Sync database is not configured");
});
