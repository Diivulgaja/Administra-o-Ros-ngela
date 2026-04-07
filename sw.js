const CACHE_NAME = 'rosouza-admin-pwa-v1';
const CORE_ASSETS = [
  './',
  './login.html',
  './index.html',
  './app.config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/css/admin.css',
  './assets/js/admin.config.js',
  './assets/js/mock-data.js',
  './assets/js/utils.js',
  './assets/js/state.js',
  './assets/js/supabase.js?v=20260407attendancefix13',
  './assets/js/auth.js?v=20260407attendancefix13',
  './assets/js/ui.js?v=20260407attendancefix13',
  './assets/js/dashboard.js?v=20260407attendancefix13',
  './assets/js/agenda.js?v=20260407attendancefix13',
  './assets/js/clientes.js?v=20260407attendancefix13',
  './assets/js/servicos.js?v=20260407attendancefix13',
  './assets/js/profissionais.js?v=20260407attendancefix13',
  './assets/js/financeiro.js?v=20260407attendancefix13',
  './assets/js/estoque.js?v=20260407attendancefix13',
  './assets/js/avaliacoes.js?v=20260407attendancefix13',
  './assets/js/mensagens.js?v=20260407attendancefix13',
  './assets/js/marketing.js?v=20260407attendancefix13',
  './assets/js/configuracoes.js?v=20260407attendancefix13',
  './assets/js/main.js?v=20260407attendancefix13',
  './assets/js/login-page.js?v=20260407attendancefix13'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./login.html', copy));
          return response;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./login.html', { ignoreSearch: true })))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      });
    })
  );
});