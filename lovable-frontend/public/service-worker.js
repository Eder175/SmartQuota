/* SmartQuota - PWA Service Worker Ultra Power Mode 🚀 */

const CACHE_NAME = "smartquota-cache-v1";
const OFFLINE_URL = "/offline.html";

// Arquivos que sempre queremos no cache
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  OFFLINE_URL,
  // Ícones PWA
  "/icons/icon-48x48.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-192x192.png",
  "/icons/icon-256x256.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png"
];

// Instala e adiciona assets ao cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Estratégias de cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 🚫 Ignora requisições não HTTP (chrome-extension, data:, etc) e não-GET (POST, PUT, etc)
  if (!request.url.startsWith("http") || request.method !== "GET") {
    return;
  }

  // HTML -> Network First (para ter dados atualizados)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, responseClone)
          );
          return response;
        })
        .catch(() =>
          caches.match(request).then((resp) => resp || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // PNG, JPG, SVG -> Cache First
  if (
    request.destination === "image" ||
    request.url.endsWith(".png") ||
    request.url.endsWith(".svg") ||
    request.url.endsWith(".jpg") ||
    request.url.endsWith(".jpeg")
  ) {
    event.respondWith(
      caches.match(request).then((resp) => {
        return (
          resp ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, responseClone)
            );
            return response;
          })
        );
      })
    );
    return;
  }

  // Default -> Cache first, fallback network
  event.respondWith(
    caches.match(request).then((resp) => {
      return (
        resp ||
        fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, responseClone)
          );
          return response;
        })
      );
    })
  );
});