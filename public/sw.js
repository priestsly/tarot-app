const CACHE_NAME = "mystic-tarot-v1";
const STATIC_ASSETS = [
    "/",
    "/icon-192.png",
    "/icon-512.png",
    "/manifest.json",
];

// Install — cache core shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
    // Skip non-GET, socket.io, and chrome-extension requests
    if (
        event.request.method !== "GET" ||
        event.request.url.includes("/socket.io") ||
        event.request.url.startsWith("chrome-extension")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok && response.type === "basic") {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    // For navigation requests, return cached index
                    if (event.request.mode === "navigate") {
                        return caches.match("/");
                    }
                    return new Response("Offline", { status: 503 });
                });
            })
    );
});
