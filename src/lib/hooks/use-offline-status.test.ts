import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_ROUTES, RSC_CACHE } from "@/lib/pwa/cache";
import { readOfflineStatus } from "./use-offline-status";

const PRECACHE = "serwist-precache-v2-https://fitflow.test/";

function mockCaches(entries: Record<string, readonly string[]>) {
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistration: async () => ({ active: {}, waiting: null }),
    },
  });
  vi.stubGlobal("caches", {
    keys: async () => Object.keys(entries),
    open: async (key: string) => ({
      keys: async () =>
        entries[key].map((route) => new Request(new URL(route, "https://fitflow.test"))),
    }),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("offline readiness", () => {
  it("is ready when every app route has both HTML and RSC", async () => {
    mockCaches({ [PRECACHE]: APP_ROUTES, [RSC_CACHE]: APP_ROUTES });

    expect(await readOfflineStatus()).toMatchObject({
      readiness: "ready",
      precachedPages: APP_ROUTES.length,
      rscEntries: APP_ROUTES.length,
    });
  });

  it("does not let unrelated pages or duplicate payloads hide a missing route", async () => {
    mockCaches({
      [PRECACHE]: APP_ROUTES,
      [RSC_CACHE]: [
        ...APP_ROUTES.filter((route) => route !== "/programs/create"),
        "/landing",
        "/dashboard?_rsc=duplicate",
      ],
    });

    expect(await readOfflineStatus()).toMatchObject({
      readiness: "partial",
      rscEntries: APP_ROUTES.length - 1,
    });
  });

  it("does not use a similarly named cache in place of the active RSC cache", async () => {
    mockCaches({
      [PRECACHE]: APP_ROUTES,
      [`${RSC_CACHE}-old`]: APP_ROUTES,
      [RSC_CACHE]: [],
    });

    expect(await readOfflineStatus()).toMatchObject({
      readiness: "partial",
      rscEntries: 0,
    });
  });

  it("stays partial when an app route's HTML is missing", async () => {
    mockCaches({
      [PRECACHE]: APP_ROUTES.filter((route) => route !== "/settings"),
      [RSC_CACHE]: APP_ROUTES,
    });

    expect(await readOfflineStatus()).toMatchObject({
      readiness: "partial",
      precachedPages: APP_ROUTES.length - 1,
      rscEntries: APP_ROUTES.length,
    });
  });

  it("stays partial when the RSC cache is absent", async () => {
    mockCaches({ [PRECACHE]: APP_ROUTES });

    expect(await readOfflineStatus()).toMatchObject({
      readiness: "partial",
      rscEntries: 0,
    });
  });
});
