/** Runtime cache name fragments managed by `src/app/sw.ts`. */
export const RUNTIME_CACHE_FRAGMENTS = [
  "exercise-library",
  "html-pages",
  "rsc-cache",
  "static-assets",
  "images",
] as const;

export async function clearRuntimeCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) =>
        RUNTIME_CACHE_FRAGMENTS.some((fragment) => key.includes(fragment))
      )
      .map((key) => caches.delete(key))
  );
}

/** Bypass HTTP/SW caches so the next load always hits the network. */
export function forceHardReload(): void {
  const url = new URL(window.location.href);
  url.searchParams.set("_sw", String(Date.now()));
  window.location.replace(url.toString());
}
