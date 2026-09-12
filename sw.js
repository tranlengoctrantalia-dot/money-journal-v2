const CACHE = 'money-journal-v2-4.1.0-2026-09-12';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './v21.css', './v21.js', './v22.css', './v22.js', './v25.css', './v25.js', './v27.js', './v28.js', './v29.js', './v31.css', './v31.js', './v32.css', './v32.js', './v33.js', './v34-import.js', './v35.css', './v36.css', './v36.js', './v37.css', './v37-ui.js', './v38-analytics.css', './v38-analytics.js', './v39-theme.css', './v39-theme.js', './v40-activity.css', './v40-activity.js', './v41-layout.css', './v41-layout.js'];

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
  const css=['v21.css','v22.css','v25.css','v31.css','v32.css','v35.css','v36.css','v37.css','v38-analytics.css','v39-theme.css','v40-activity.css','v41-layout.css'];
  css.forEach(f=>{if(!html.includes(f)) html=html.replace('</head>', `<link rel="stylesheet" href="./${f}?v=410"></head>`)});
  const js=['v21.js','v22.js','v25.js','v27.js','v28.js','v29.js','v31.js','v32.js','v33.js','v34-import.js','v36.js','v37-ui.js','v38-analytics.js','v39-theme.js','v40-activity.js','v41-layout.js'];
  js.forEach(f=>{if(!html.includes(f)) html=html.replace('</body>', `<script src="./${f}?v=410" defer></script></body>`)});
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