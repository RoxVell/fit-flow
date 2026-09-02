/**
 * Static app routes precached by the service worker (HTML at install,
 * RSC payload at activate). Keep in sync with `src/app/(main)`.
 */
export const APP_ROUTES = [
  "/dashboard",
  "/workout",
  "/workout/active",
  "/workout/cardio",
  "/programs/library",
  "/programs/create",
  "/progress",
  "/progress/body/log",
  "/settings",
] as const;

export const RSC_CACHE = "rsc-cache";
export const HTML_CACHE = "html-pages";
export const STATIC_ASSETS_CACHE = "static-assets";
export const EXERCISE_LIBRARY_CACHE = "exercise-library";

/**
 * Runtime caches tied to a build; dropped when a new service worker
 * activates. The exercise library is precached in production, but in dev
 * (no precache) its CacheFirst copy would outlive a rebuilt catalog.
 */
export const BUILD_BOUND_CACHES = [
  RSC_CACHE,
  HTML_CACHE,
  STATIC_ASSETS_CACHE,
  EXERCISE_LIBRARY_CACHE,
] as const;

/** Reload so the new service worker serves the freshly precached shell. */
export function reloadApp(): void {
  window.location.reload();
}
