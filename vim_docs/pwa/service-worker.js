// VIM service worker — offline app shell cache.
// Cache-first for same-origin GET (the app is a single self-contained HTML);
// everything else (e.g. submissions to Kobo) goes straight to the network.

const CACHE = 'vim-v1';
const CORE = ['./valigia_immateriale.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))   // icons cached lazily on first fetch
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Only handle same-origin GETs; let POST/submit and cross-origin pass through.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(hit => hit ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));   // grow cache (e.g. icons)
        return res;
      }).catch(() => caches.match('./valigia_immateriale.html')))
  );
});
