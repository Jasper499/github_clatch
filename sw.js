/* HJL Clatch service worker — cache shell + recent data for offline reading. */
const CACHE_SHELL = "clatch-shell-v15";
const CACHE_DATA = "clatch-data-v15";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css?v=15",
  "./js/app.js?v=15",
  "./js/icons.js?v=15",
  "./vendor/marked.min.js",
  "./vendor/purify.min.js",
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_SHELL && key !== CACHE_DATA)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isDataRequest(url) {
  return (
    url.pathname.includes("/data/meta.json") ||
    url.pathname.includes("/data/manifest.json") ||
    url.pathname.includes("/data/sources/") ||
    url.pathname.includes("/data/history/") ||
    url.pathname.includes("/data/feeds/")
  );
}

/** App shell that must pick up deploys quickly (avoid sticky cacheFirst). */
function isFreshShellRequest(url) {
  const path = url.pathname;
  return (
    path.endsWith("/index.html") ||
    path.endsWith("/") ||
    path.endsWith("/css/style.css") ||
    path.endsWith("/js/app.js") ||
    path.endsWith("/js/icons.js") ||
    path.endsWith("/sw.js") ||
    path.endsWith("/manifest.webmanifest")
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

  if (req.mode === "navigate" || isFreshShellRequest(url)) {
    event.respondWith(
      networkFirst(req, CACHE_SHELL).catch(() => caches.match("./index.html"))
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
