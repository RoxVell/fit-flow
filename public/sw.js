const CACHE_NAME = "fitflow-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/workout/active",
  "/workout/cardio",
  "/programs/library",
  "/programs/builder",
  "/progress",
  "/manifest.json",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, clone);
              }
            });
            return response;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("/dashboard");
            }
            return new Response("Offline", { status: 503 });
          })
      );
    })
  );
});
