/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";
import { matchPrecache, setCatchHandler } from "serwist/legacy";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[];
};

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
  cleanupOutdatedCaches: true,
});

setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const fallback = await matchPrecache("/offline.html");
    if (fallback) return fallback;
  }
  return Response.error();
});
