const APP_VERSION = '20260516s';
const CACHE_NAME = `chimiopro-v${APP_VERSION}`;

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
  './js/site-official-data.js',
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
      const localAssets = cache.addAll(ASSETS.map(asset => `${asset}?v=${APP_VERSION}`)).catch(() => cache.addAll(ASSETS));
      CDN_LIBS.forEach(url => {
        fetch(url).then(r => { if (r.ok) cache.put(url, r); }).catch(() => {});
      });
      return localAssets;
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}))
      .then(clients => clients.forEach(client => client.postMessage({type:'CHIMIOPRO_VERSION_READY', version:APP_VERSION})))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHIMIOPRO_SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CHIMIOPRO_GET_VERSION') {
    event.source?.postMessage({type:'CHIMIOPRO_VERSION', version:APP_VERSION, cache:CACHE_NAME});
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request, {cache:'no-store'}).catch(() =>
          caches.match(`./index.html?v=${APP_VERSION}`).then(cached => cached || caches.match('./index.html'))
        )
      );
      return;
    }

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
