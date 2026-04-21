/* =====================================================
   🌸 bhavya event mart PWA — SERVICE WORKER (v4 FINAL FIX)
   (SPA-safe, APK-safe, AAB-safe)
===================================================== */

// -----------------------------------------------------
// 🧪 DISABLE SERVICE WORKER ON LOCALHOST (DEV MODE)
// -----------------------------------------------------
if (self.location.hostname === "localhost") {
  console.log("[ServiceWorker] Localhost detected — SW disabled in dev mode.");

  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", () => {
    self.clients.claim();
  });

  // No caching / no interception in dev
  self.addEventListener("fetch", () => {});
}

/* =====================================================
   🚀 PRODUCTION PWA LOGIC
===================================================== */
else {

  const CACHE_NAME = "pankajcloth-cache-v3";

  const URLS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/favicon.ico"
  ];

  // ---------------------------------------------------
  // 📦 INSTALL — Cache core shell only
  // ---------------------------------------------------
  self.addEventListener("install", (event) => {
    console.log("[ServiceWorker] Installing & caching core files...");
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
    );
    self.skipWaiting();
  });

  // ---------------------------------------------------
  // ♻️ ACTIVATE — Clean old caches
  // ---------------------------------------------------
  self.addEventListener("activate", (event) => {
    console.log("[ServiceWorker] Activating...");
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[ServiceWorker] Removing old cache:", key);
              return caches.delete(key);
            }
          })
        )
      )
    );
    self.clients.claim();
  });

  // ---------------------------------------------------
  // 🌐 FETCH — Network first + SPA fallback (APK FIX)
  // ---------------------------------------------------
  self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => {
          // ✅ SPA navigation fallback (CRITICAL FOR APK)
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // ✅ Asset fallback (icons, css, etc.)
          return caches.match(event.request);
        })
    );
  });

  // ---------------------------------------------------
  // ⏭️ SKIP WAITING (OPTIONAL UPDATE CONTROL)
  // ---------------------------------------------------
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });

}
