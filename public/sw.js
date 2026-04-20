const CACHE = 'scout-shell-v1';
const SHELL = ['/scout', '/scout-manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only cache-first for same-origin shell navigation; everything else network-first
  if (e.request.mode === 'navigate' && url.pathname.startsWith('/scout')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/scout'))
    );
    return;
  }
  // Pass through all API/data requests fresh
});
