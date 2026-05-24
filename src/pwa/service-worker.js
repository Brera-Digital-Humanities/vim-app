// VIM service worker — offline app shell cache.
// Cache-first for same-origin GET (the app is a single self-contained HTML) and
// for Google Fonts, so typography also works offline (after a first online load).
// Everything else (e.g. submissions to Kobo) goes straight to the network.

const CACHE = 'vim-v1';
const CORE = ['./index.html', './manifest.json'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

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
  if (req.method !== 'GET') return;                 // let POST/submit pass through
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont     = FONT_HOSTS.includes(url.host); // Google Fonts CSS + .woff2
  // Cache-first for the app shell and the fonts; everything else (e.g. Kobo) → network.
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    caches.match(req).then(hit => hit ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));   // grow cache (icons, fonts)
        return res;
      }).catch(() => sameOrigin ? caches.match('./index.html') : undefined))
  );
});
