import { test as base, expect, type Page } from "@playwright/test";

/**
 * Base test with project-wide setup:
 *  - Blocks the Serwist service-worker route (PWA only — keeps tests fast and deterministic).
 *  - Clears the locale cookie before navigation so the suite always boots in English.
 *  - Default to the English locale.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      // Strip the locale cookie so messages.ts defaults to English.
      document.cookie = "fitflow-locale=; path=/; max-age=0";

      // Stub out the service-worker registration so it can't intercept requests.
      // The app calls `navigator.serviceWorker.register(...)` from
      // ServiceWorkerRegister; we replace it with a no-op before any
      // client code runs. The property is marked readonly on the public
      // type, so we cast through `unknown` to mutate it.
      if ("serviceWorker" in navigator) {
        const stub = navigator.serviceWorker as unknown as {
          register: () => Promise<ServiceWorkerRegistration | undefined>;
        };
        stub.register = () => Promise.resolve(undefined);
      }
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
