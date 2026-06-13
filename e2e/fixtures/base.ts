import { test as base, expect, type Page } from "@playwright/test";

/**
 * Base test with project-wide setup:
 *  - Stubs the Serwist service worker so it can't intercept requests.
 *  - Clears all cookies before every test so the suite always boots in
 *    English (the default). The clear is done in `beforeEach` rather
 *    than as an init script: a per-load init script would run *after*
 *    the reload's HTTP response and would silently delete the
 *    `fitflow-locale` cookie that the previous request set, so any
 *    client-side reader of `document.cookie` would see no value and
 *    fall back to the default locale (defeating tests that try to
 *    verify persistence). Clearing in `beforeEach` keeps the cookie
 *    intact for the duration of a single test, including across
 *    reloads.
 *  - Routes `/api/sync` to a 200 no-op. The real handler requires a Neon DB
 *    connection, and the resulting 500 fires the Next.js dev error overlay
 *    (`<nextjs-portal>`) which intercepts pointer events and breaks clicks.
 *
 * The service-worker stub returns a minimal `ServiceWorkerRegistration`
 * shape so Serwist's `register()` can call `.addEventListener`,
 * `.update()`, etc. without throwing. We can't return a fully-typed
 * ServiceWorkerRegistration (the constructor is not exposed), so a
 * duck-typed object with the fields Serwist touches is enough.
 */
const SYNC_STUB_BODY = JSON.stringify({
  changes: [],
  accepted: [],
  superseded: [],
  serverChanges: [],
  serverTime: new Date().toISOString(),
});

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route("**/api/sync", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: SYNC_STUB_BODY,
      });
    });

    await context.addInitScript(() => {
      // Stub the service-worker registration so it can't intercept
      // requests. The app calls `navigator.serviceWorker.register(...)`
      // from ServiceWorkerRegister; we replace it with a no-op before any
      // client code runs. The property is readonly on the public type, so
      // we cast through `unknown` to mutate it.
      //
      // Serwist's `register()` chains `_registration.addEventListener(...)`
      // (for the `updatefound` event) and `_registration.update()` — see
      // node_modules/@serwist/window/src/Serwist.ts. The stub must
      // implement the full `EventTarget` interface (addEventListener,
      // removeEventListener, dispatchEvent) plus the other fields
      // Serwist reads, otherwise a `TypeError: ... is not a function`
      // fires the Next.js dev error overlay which intercepts pointer
      // events and breaks clicks in the e2e tests.
      if ("serviceWorker" in navigator) {
        const stubRegistration = {
          waiting: null,
          active: null,
          installing: null,
          scope: "/",
          updateViaCache: "none" as ServiceWorkerUpdateViaCache,
          pushManager: {
            subscribe: () => Promise.reject(new Error("stubbed")),
            getSubscription: () => Promise.resolve(null),
            permissionState: () =>
              Promise.resolve("denied" as NotificationPermission),
          },
          navigationPreload: {
            enable: () => Promise.resolve(),
            disable: () => Promise.resolve(),
            setHeaderValue: () => Promise.resolve(),
            getState: () => Promise.resolve(),
          },
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          update: () => Promise.resolve(),
          unregister: () => Promise.resolve(true),
          getNotifications: () => Promise.resolve([]),
          showNotification: () => Promise.resolve(),
        };
        const stub = navigator.serviceWorker as unknown as {
          register: () => Promise<unknown>;
        };
        stub.register = () => Promise.resolve(stubRegistration);
      }
    });
    await use(context);
  },
});

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
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