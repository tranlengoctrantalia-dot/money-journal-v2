const CACHE = 'money-journal-v2-4.5.0-2026-09-13';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './v21.css', './v22.css', './v44-rebuild.css', './v44-rebuild.js', './v45-polish.css', './v45-polish.js'];

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
  if (!html.includes('mj_theme_mode')) html = html.replace('<head>', '<head><script>(function(){try{var t=localStorage.getItem("mj_theme_mode")==="dark"?"dark":"light";document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t}catch(e){}})();</script>');
  if (!html.includes('v44-rebuild.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./v44-rebuild.css?v=450"></head>');
  if (!html.includes('v45-polish.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./v45-polish.css?v=450"></head>');
  if (!html.includes('v44-rebuild.js')) html = html.replace('</body>', '<script src="./v44-rebuild.js?v=450" defer></script></body>');
  if (!html.includes('v45-polish.js')) html = html.replace('</body>', '<script src="./v45-polish.js?v=450" defer></script></body>');
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