const CACHE_NAME = 'kiip-level4-brand-v19';
const APP_SHELL = ['./', './app.html', './index.html', './practice.html', './writing.html', './manifest.webmanifest', './icon.svg', './site-brand.js'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kiip-level4-') && key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(async response=>{
    if(!response.ok)return response;
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
    const type=response.headers.get('content-type')||'';
    if(type.includes('text/html')){
      let html=await response.text();
      if(!html.includes('site-brand.js'))html=html.replace(/<\/body>/i,'<script src="./site-brand.js"></script></body>');
      return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
    }
    return response;
  }).catch(async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    if(request.mode==='navigate')return caches.match('./app.html');
    return Response.error();
  }));
});
