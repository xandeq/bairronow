// BUMP this version on every deploy to bust stale HTML/CSS/JS caches.
const CACHE_NAME = 'bairronow-v3';
const OFFLINE_URL = '/offline/';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API: network-first, no caching
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Content-hashed static assets (_next/static/**): cache-first, safe to cache long-term
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML documents and other pages: network-first to always get fresh HTML
  // Falls back to offline page only if completely offline
  e.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(
          (cached) => cached || caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 })
        );
      })
  );
});
