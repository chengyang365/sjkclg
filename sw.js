const VERSION = 'lg-app-center-v17';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './mpt4-pra-infografik.svg', './mpt4-pra-infografik-zh.svg', './jadual-guru-bertugas-penggal-3-2026.png?v=20261001b'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  // Documents must prefer the network so online launches do not stay on a stale app shell.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(async response => {
      if (response && response.ok) {
        await caches.open(VERSION).then(cache => cache.put(request, response.clone()));
        return response;
      }
      return await caches.match(request) || await caches.match('./index.html') || await caches.match('./') || response;
    }).catch(async () => {
      const cached = await caches.match(request) || await caches.match('./index.html') || await caches.match('./');
      if (cached) return cached;
      return new Response('Offline. Please reconnect and try again.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          caches.open(VERSION).then(cache => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
