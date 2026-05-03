/* =====================================================
   🌸 BHAVYA EVENT MART — SERVICE WORKER (v5 FINAL FIX)
   (Fixes favicon + manifest cache issue permanently)
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

  // 🔥 CHANGE VERSION EVERY TIME YOU UPDATE ICONS
  const CACHE_NAME = "bhavya-cache-v5";

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
  // 🌐 FETCH — Network First (NO CACHE FOR ICONS)
  // ---------------------------------------------------
  self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

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
        .then((response) => response)
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return caches.match(event.request);
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