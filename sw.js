/* HJL Clatch service worker — cache shell + recent data for offline reading. */
const CACHE_SHELL = "clatch-shell-v3";
const CACHE_DATA = "clatch-data-v3";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/icons.js",
  "./favicon.svg",
  "./manifest.webmanifest",
  "./data/meta.json",
  "./data/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_SHELL && key !== CACHE_DATA)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isDataRequest(url) {
  return (
    url.pathname.includes("/data/meta.json") ||
    url.pathname.includes("/data/manifest.json") ||
    url.pathname.includes("/data/sources/") ||
    url.pathname.includes("/data/history/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isDataRequest(url)) {
    event.respondWith(networkFirst(req, CACHE_DATA));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_SHELL).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(cacheFirst(req, CACHE_SHELL));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    return caches.match("./index.html");
  }
}

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
