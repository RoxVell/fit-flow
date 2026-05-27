const CACHE = "fitflow-v6";
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

  await Promise.all(
    PAGES.map((url) =>
      fetch(url).then((r) => { if (r.ok) cache.put(url, r); }).catch(() => {})
    )
  );

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
    } catch (_) {}
  }

  await Promise.all(
    Array.from(urls).map((url) =>
      fetch(url).then((r) => { if (r.ok) cache.put(url, r); }).catch(() => {})
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

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(url.href).then((r) => {
        const cached = r.clone();
        caches.open(CACHE).then((c) => c.put(request, cached)).catch(() => {});
        return r;
      }).catch(() =>
        caches.match(request).then((c) => c || caches.match("/dashboard"))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((r) => {
        if (r.ok && url.origin === ORIGIN) {
          const cached = r.clone();
          caches.open(CACHE).then((c) => c.put(request, cached)).catch(() => {});
        }
        return r;
      }).catch(() => new Response(null, { status: 408 }));
    })
  );
});
