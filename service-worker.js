const CACHE_NAME = 'kiip-level4-fresh-home-v24';
const APP_SHELL = ['./', './app.html', './index.html', './practice.html', './writing.html', './updates.html', './manifest.webmanifest', './icon.svg', './site-brand.js', './home-style.css'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kiip-level4-') && key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.openWindow('./updates.html')); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const isHTML = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
    try {
      // Always revalidate network content so a normal refresh can receive the latest published HTML.
      const freshRequest = new Request(request, { cache: 'no-store' });
      const response = await fetch(freshRequest);
      if (!response.ok) return response;
      if (!isHTML) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      }
      let html = await response.text();
      const isHome = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
      if (isHome && !html.includes('home-style.css')) html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="./home-style.css?v=24"></head>');
      if (!html.includes('site-brand.js')) html = html.replace(/<\/body>/i, '<script src="./site-brand.js?v=24"></script></body>');
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.set('cache-control', 'no-store, no-cache, must-revalidate');
      const updated = new Response(html, { status: response.status, statusText: response.statusText, headers });
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, updated.clone()).catch(() => {});
      return updated;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const home = await caches.match('./index.html');
        if (home) return home;
        const app = await caches.match('./app.html');
        if (app) return app;
      }
      return Response.error();
    }
  })());
});
