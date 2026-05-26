const CACHE = "fitflow-v3";
const ORIGIN = self.location.origin;

const PRECACHE = [
  "/",
  "/dashboard",
  "/workout/active",
  "/workout/cardio",
  "/programs/library",
  "/programs/builder",
  "/progress",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
];

async function precacheWithChunks() {
  const cache = await caches.open(CACHE);
  await cache.addAll(PRECACHE);

  const urls = new Set();

  for (const page of PRECACHE) {
    const res = await cache.match(page);
    if (!res) continue;
    const html = await res.text();

    const scriptRe = /<script[^>]+src=["']([^"']+)["']/g;
    let m;
    while ((m = scriptRe.exec(html))) {
      const src = m[1];
      if (src.startsWith("/")) urls.add(ORIGIN + src);
    }

    const linkRe = /<link[^>]+href=["']([^"']+)["']/g;
    while ((m = linkRe.exec(html))) {
      const href = m[1];
      if (href.startsWith("/") && href.includes("static")) urls.add(ORIGIN + href);
    }
  }

  await Promise.all(
    Array.from(urls).map((url) =>
      fetch(url)
        .then((r) => { if (r.ok) cache.put(url, r); })
        .catch(() => {})
    )
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precacheWithChunks());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Static assets: cache-first with network fallback
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => new Response(null, { status: 408 }));
        })
      )
    );
    return;
  }

  // Navigation: network-first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/dashboard"))
        )
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok && url.origin === ORIGIN) {
            caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => new Response("Offline", { status: 503 }));
    })
  );
});
