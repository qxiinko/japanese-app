/* Service worker — «Японский: путь к аниме».
   Стратегия: cache-first для оболочки приложения; сетевые запросы
   навигации при офлайне отдаются из кэша (офлайн-режим). */
const CACHE_NAME='jp-anime-path-v1';
const APP_FILES=[
  './','./index.html','./manifest.webmanifest','./favicon.png',
  './icon-192.png','./icon-512.png','./icon-maskable-512.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
  ).then(()=>self.clients.claim())));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(e.request.mode==='navigate'||e.request.destination==='document'){
    e.respondWith(
      fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cp));return r;})
        .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const cp=resp.clone();
      if(resp.ok)caches.open(CACHE_NAME).then(c=>c.put(e.request,cp));
      return resp;
    }))
  );
});
