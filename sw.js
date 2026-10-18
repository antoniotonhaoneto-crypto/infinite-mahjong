const CACHE = 'infinite-mahjong-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/mahjong.svg',
  './css/styles.css',
  './js/main.js',
  './js/game.js',
  './js/ui.js',
  './js/renderer.js',
  './js/board.js',
  './js/state.js',
  './js/sound.js',
  './js/data.js',
  './js/prng.js',
  './js/pwa.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith('infinite-mahjong-pwa-') && key !== CACHE)
        .map(key => caches.delete(key))
    )),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const refreshed = fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
      return cached || refreshed;
    })
  );
});