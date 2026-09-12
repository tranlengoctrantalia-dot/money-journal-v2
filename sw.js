const CACHE = 'money-journal-v2-2.1.1-2026-09-12';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './v21.css', './v21.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

async function injectV21(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  if (!html.includes('v21.js')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="./v21.css"></head>')
               .replace('</body>', '<script src="./v21.js" defer></script></body>');
  }
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(html, {status: response.status, statusText: response.statusText, headers});
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/money-journal-v2/')) {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request, {cache: 'no-store'});
        const enhanced = await injectV21(network);
        const copy = enhanced.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return enhanced;
      } catch (e) {
        const cached = await caches.match(event.request) || await caches.match('./index.html');
        return cached ? injectV21(cached) : Response.error();
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
