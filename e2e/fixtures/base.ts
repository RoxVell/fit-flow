import { test as base, expect, type Page } from "@playwright/test";

export const test = base.extend({
  context: async ({ context }, provideContext) => {
    // Catalog thumbnails are hosted outside the app. Keep the development
    // suite independent of that CDN, including while closing a large picker.
    await context.route("https://api.smartworkout.app/asset/image/**", (route) =>
      route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' })
    );
    await context.route("**/api/sync", (route) => route.fulfill({
      json: route.request().method() === "GET"
        ? { enabled: false }
        : { changes: [], accepted: [], superseded: [], rejected: [], serverChanges: [], serverTime: new Date().toISOString() },
    }));

    // Serwist registers event listeners and requests updates on this object.
    await context.addInitScript(() => {
      if ("serviceWorker" in navigator) {
        const registration = Object.assign(new EventTarget(), {
          waiting: null, installing: null, active: null, update: async () => {},
        });
        Object.defineProperty(navigator.serviceWorker, "register", {
          configurable: true, value: async () => registration,
        });
      }
    });
    await provideContext(context);
    await context.unrouteAll({ behavior: "wait" });
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
          const countReq = tx.objectStore("programs").count();
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
