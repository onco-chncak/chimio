const CACHE_NAME = 'chimiopro-v20260516d';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/auth.js',
  './js/main.js',
  './js/dashboard.js',
  './js/rdv.js',
  './js/clinical-modules.js',
  './js/data-tools.js',
  './js/supabase-sync.js',
  './js/protocol-editor.js',
  './js/app-polish.js',
  './js/enhancements.js',
  './js/requested-improvements.js',
  './js/final-improvements.js',
  './manifest.json'
];

const CDN_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(ASSETS);
      CDN_LIBS.forEach(url => {
        fetch(url).then(r => { if (r.ok) cache.put(url, r); }).catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return undefined;
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
