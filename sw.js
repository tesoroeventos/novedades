const CACHE = 'novedades-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // El servidor (Apps Script) y Drive nunca pasan por acá: siempre van directo a la red.
  const propio = url.origin === self.location.origin;
  const fuentes = /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.host);
  if (!propio && !fuentes) return;
  const isPage = e.request.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(isPage ? './index.html' : e.request);
    const net = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(isPage ? './index.html' : e.request, res.clone());
      return res;
    }).catch(() => cached);
    if (isPage) return net.then(r => r || cached);
    return cached || net;
  })());
});
