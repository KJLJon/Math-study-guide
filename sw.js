// Network-first service worker: always tries to fetch the newest files (so updates
// pushed to GitHub Pages show up right away) and falls back to the cache offline.
const CACHE = 'math-quest-v7';
const ASSETS = ['./', 'index.html', 'style.css', 'js/core.js', 'js/store.js', 'js/praise.js', 'js/problems.js', 'js/act-solve.js', 'js/act-percent.js', 'js/act-convert.js', 'js/act-words.js', 'js/explainers.js', 'js/blitz.js', 'js/app.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./')))
  );
});
