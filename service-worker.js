const CACHE_NAME = "hisebkhata-cache-v1";
const urlsToCache = [
  "/Hisebkhata/",
  "/Hisebkhata/index.html",
  "/Hisebkhata/style.css",
  "/Hisebkhata/app.js",
  "/Hisebkhata/manifest.json",
  "/Hisebkhata/icons/icon-192.png",
  "/Hisebkhata/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res =>
      res || fetch(event.request).catch(() => caches.match("/Hisebkhata/index.html"))
    )
  );
});