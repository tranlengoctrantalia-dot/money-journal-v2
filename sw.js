const CACHE = 'money-journal-v2-2.5.0-2026-09-12';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './v21.css', './v21.js', './v22.css', './v22.js', './v25.css', './v25.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

async function enhanceHtml(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  if (!html.includes('v21.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./v21.css?v=250"></head>');
  if (!html.includes('v22.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./v22.css?v=250"></head>');
  if (!html.includes('v25.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./v25.css?v=250"></head>');
  if (!html.includes('v21.js')) html = html.replace('</body>', '<script src="./v21.js?v=250" defer></script></body>');
  if (!html.includes('v22.js')) html = html.replace('</body>', '<script src="./v22.js?v=250" defer></script></body>');
  if (!html.includes('v25.js')) html = html.replace('</body>', '<script src="./v25.js?v=250" defer></script></body>');
  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
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
        const enhanced = await enhanceHtml(network);
        const copy = enhanced.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return enhanced;
      } catch (e) {
        const cached = await caches.match(event.request) || await caches.match('./index.html');
        return cached ? enhanceHtml(cached) : Response.error();
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});