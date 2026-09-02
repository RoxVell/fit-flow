/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Route,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";
import {
  APP_ROUTES,
  BUILD_BOUND_CACHES,
  EXERCISE_LIBRARY_CACHE,
  HTML_CACHE,
  RSC_CACHE,
  STATIC_ASSETS_CACHE,
} from "@/lib/pwa/cache";

const networkOnlyApi = new NetworkOnly();

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Next.js appends `_rsc=<hash of router headers>` to every RSC fetch, so the
 * same route gets a different URL depending on where the user navigates
 * from. All pages are static, so the payload is identical regardless of the
 * query string (`?session=`, `?tab=`): key by path only.
 */
const pathOnlyKey: SerwistPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const url = new URL(request.url);
    url.search = "";
    return url.href;
  },
};

const isRscRequest = (request: Request) =>
  request.method === "GET" &&
  (request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1");

// Responses carry `Vary: RSC, Next-Router-State-Tree, ...`; without
// ignoreVary the Cache API would only match a request with identical headers.
const rscStrategy = new StaleWhileRevalidate({
  cacheName: RSC_CACHE,
  matchOptions: { ignoreVary: true },
  plugins: [
    pathOnlyKey,
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
  ],
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // Query strings never change the static HTML (`/workout?tab=history`).
    ignoreURLParametersMatching: [/./],
    matchOptions: { ignoreVary: true },
  },
  skipWaiting: false,
  // Claimed manually at the end of `activate`, after the RSC warm-up.
  clientsClaim: false,
  // Navigations are served from precache, so a parallel network request
  // would just be wasted bandwidth.
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: networkOnlyApi,
    },
    {
      matcher: ({ url }) => url.hostname === "api.smartworkout.app",
      handler: networkOnlyApi,
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/exercises/"),
      handler: new CacheFirst({
        cacheName: EXERCISE_LIBRARY_CACHE,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: STATIC_ASSETS_CACHE,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      // `/` is a server redirect and cannot be precached; answer it locally
      // so opening the bare origin works offline.
      matcher: ({ request, url }) =>
        request.mode === "navigate" && url.pathname === "/",
      handler: async () =>
        Response.redirect(new URL("/dashboard", self.location.origin), 307),
    },
    {
      // Only routes missing from the precache manifest end up here.
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: HTML_CACHE,
        networkTimeoutSeconds: 3,
        matchOptions: { ignoreVary: true },
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// The precache route is registered first and matches by URL alone, so an
// RSC fetch for `/dashboard?_rsc=…` would receive the precached HTML.
// Put the RSC route ahead of it.
const getRoutes = serwist.routes.get("GET");
if (!getRoutes) throw new Error("Serwist registered no GET routes");
getRoutes.unshift(new Route(({ request }) => isRscRequest(request), rscStrategy));

/**
 * A new build means new chunks and payloads: drop the build-bound runtime
 * caches, then warm the RSC cache so client-side navigation between tabs
 * works offline without the user visiting every page first. Clients are
 * claimed only after that, so the reload triggered by `controllerchange`
 * never sees a half-filled cache. Warming during `install` would be too
 * early: the old worker is still serving and would hand out payloads that
 * reference chunks it does not have.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => BUILD_BOUND_CACHES.some((name) => key.includes(name)))
          .map((key) => caches.delete(key))
      );
      const results = await Promise.allSettled(
        APP_ROUTES.map((url) => {
          const request = new Request(url, { headers: { RSC: "1" } });
          return Promise.all(rscStrategy.handleAll({ request, event }));
        })
      );
      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.warn(`[sw] RSC warm-up failed for ${APP_ROUTES[i]}`, result.reason);
        }
      });
      await self.clients.claim();
    })()
  );
});

serwist.addEventListeners();
