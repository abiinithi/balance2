const CACHE_NAME = 'balance-cache-v4'; // Bumped: switched to split css/js files
const ASSETS = [
  '/',
  '/index.html',
  '/transaction.html',
  '/history.html',
  '/create-bucket.html',
  '/manage-bucket.html',
  '/month-end.html',
  '/css/base.css',
  '/css/dashboard.css',
  '/css/history.css',
  '/css/month-end.css',
  '/js/core.js',
  '/js/dashboard.js',
  '/js/transaction.js',
  '/js/history.js',
  '/js/create-bucket.js',
  '/js/manage-bucket.js',
  '/js/month-end.js',
  '/manifest.json',
  '/icon.svg',
  '/fonts/Ndot57-Regular.otf',
  '/fonts/NType82Mono-Regular.otf',
  '/fonts/LetteraMonoLL-Regular.otf',
  '/fonts/SpaceMono-Regular.otf'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache immediately, fetch from network in background to update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network failures cleanly */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});