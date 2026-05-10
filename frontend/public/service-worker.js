/* =====================================================
   🌸 BHAVYA EVENT MART — SERVICE WORKER (v6 FINAL STABLE)
   (Fixes category crash + safe fetch handling)
===================================================== */

// -----------------------------------------------------
// 🧪 DISABLE SERVICE WORKER ON LOCALHOST (DEV MODE)
// -----------------------------------------------------
if (self.location.hostname === "localhost") {
  console.log("[SW] Dev mode — disabled");

  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", () => self.clients.claim());
  self.addEventListener("fetch", () => {});
}

/* =====================================================
   🚀 PRODUCTION LOGIC
===================================================== */
else {

  // 🔥 CHANGE VERSION WHEN YOU UPDATE CACHE
  const CACHE_NAME = "bhavya-cache-v6";

  const URLS_TO_CACHE = [
    "/",
    "/index.html"
    // ❌ DO NOT CACHE manifest.json or favicon
  ];

  // ---------------------------------------------------
  // 📦 INSTALL — Cache minimal shell only
  // ---------------------------------------------------
  self.addEventListener("install", (event) => {
    console.log("[SW] Installing...");

    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
    );

    self.skipWaiting();
  });

  // ---------------------------------------------------
  // ♻️ ACTIVATE — Delete old caches
  // ---------------------------------------------------
  self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");

    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", key);
              return caches.delete(key);
            }
          })
        )
      )
    );

    self.clients.claim();
  });

  // ---------------------------------------------------
  // 🌐 FETCH — Network First (SAFE VERSION)
  // ---------------------------------------------------
  self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // 🔥 VERY IMPORTANT: Skip API & dynamic routes
    if (
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/categories")
    ) {
      return;
    }

    // ❌ NEVER CACHE THESE (IMPORTANT FIX)
    if (
      url.pathname.includes("favicon") ||
      url.pathname.includes("manifest") ||
      url.pathname.includes("icon")
    ) {
      event.respondWith(fetch(event.request));
      return;
    }

    // ✅ Normal requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response; // ✅ always return Response
        })
        .catch(() => {
          // ✅ SPA fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // ✅ NEVER return undefined (critical fix)
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        })
    );
  });

  // ---------------------------------------------------
  // ⏭️ FORCE UPDATE (OPTIONAL)
  // ---------------------------------------------------
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });
}