const CACHE = "fitflow-v5";
const ORIGIN = self.location.origin;

const PAGES = [
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

async function install() {
  const cache = await caches.open(CACHE);

  // Step 1: Cache all HTML pages and static assets
  await Promise.all(
    PAGES.map((url) =>
      fetch(url).then((r) => {
        if (r.ok) cache.put(url, r);
      }).catch(() => {})
    )
  );

  // Step 2: From each HTML page, extract and cache all referenced chunks
  const urls = new Set();
  for (const page of PAGES) {
    const res = await cache.match(page);
    if (!res) continue;

    try {
      const html = await res.text();
      const re = /(?:src|href)="(https?:\/\/[^"]+|\/[^"]+)"/g;
      let m;
      while ((m = re.exec(html))) {
        const u = m[1];
        if (u.startsWith("/")) urls.add(ORIGIN + u);
        else if (u.startsWith(ORIGIN)) urls.add(u);
      }
    } catch (e) {
      // skip pages that fail to parse
    }
  }

  // Cache all extracted URLs
  await Promise.all(
    Array.from(urls).map((url) =>
      fetch(url).then((r) => {
        if (r.ok) cache.put(url, r);
      }).catch(() => {})
    )
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(install());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache same-origin responses for future offline use
  const save = (res) => {
    if (res.ok && !res.bodyUsed) {
      caches.open(CACHE).then((c) => c.put(request, res.clone()));
    }
  };

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((r) => { save(r); return r; })
        .catch(() =>
          caches.match(request).then((c) => c || caches.match("/dashboard"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((r) => {
        if (r.ok && url.origin === ORIGIN) save(r);
        return r;
      }).catch(() => new Response(null, { status: 408 }));
    })
  );
});
