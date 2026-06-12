import { test as base, expect, type Page } from "@playwright/test";

/**
 * Base test with project-wide setup:
 *  - Stubs the Serwist service worker so it can't intercept requests.
 *  - Strips the locale cookie before navigation so the suite always boots
 *    in English (the default).
 *  - Stubs /api/sync to a 200 no-op. The real handler requires a Neon DB
 *    connection, and the resulting 500 fires the Next.js dev error overlay
 *    (`<nextjs-portal>`) which intercepts pointer events and breaks clicks.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      // Strip the locale cookie so messages.ts defaults to English.
      document.cookie = "fitflow-locale=; path=/; max-age=0";

      // Stub the service-worker registration so it can't intercept
      // requests. The app calls `navigator.serviceWorker.register(...)`
      // from ServiceWorkerRegister; we replace it with a no-op before any
      // client code runs. The property is readonly on the public type, so
      // we cast through `unknown` to mutate it.
      if ("serviceWorker" in navigator) {
        const stub = navigator.serviceWorker as unknown as {
          register: () => Promise<ServiceWorkerRegistration | undefined>;
        };
        stub.register = () => Promise.resolve(undefined);
      }

      // Stub the /api/sync endpoint. The real handler expects a Neon DB
      // and throws on every call in dev, which fires the Next.js dev
      // error overlay and breaks the test pointer chain. Resolving with
      // a 200 + empty server-side response keeps the app's outbox happy
      // without surfacing any UI error.
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if (url.endsWith("/api/sync")) {
          return Promise.resolve(
            new Response(JSON.stringify({ changes: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return originalFetch(input, init);
      };
    });
    await use(context);
  },
});

export { expect };

/**
 * Wait for the IndexedDB seed to be ready. The app's first visit triggers
 * `ensureSeeded()` which inserts the PPL reference program. Tests that
 * interact with the active program rely on this.
 */
export async function waitForSeed(page: Page) {
  await page.waitForFunction(
    async () => {
      const dbs = await indexedDB.databases?.();
      if (!dbs?.some((d) => d.name === "fitflow_v2")) return false;
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open("fitflow_v2");
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("programs")) {
            db.close();
            return resolve(false);
          }
          const tx = db.transaction("programs", "readonly");
          const store = tx.objectStore("programs");
          const countReq = store.count();
          countReq.onsuccess = () => {
            db.close();
            resolve(countReq.result > 0);
          };
          countReq.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        req.onerror = () => resolve(false);
      });
    },
    null,
    { timeout: 10_000 },
  );
}

/**
 * Wipe IndexedDB so the next page load re-seeds fresh data.
 * Use at the start of tests that need a clean slate.
 */
export async function clearIndexedDb(page: Page) {
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases?.();
    if (!dbs) return;
    for (const info of dbs) {
      if (info.name) {
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(info.name as string);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });
      }
    }
  });
}
