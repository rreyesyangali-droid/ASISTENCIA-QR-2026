// ══════════════════════════════════════════════════════════════════
// sw.js — Service Worker de AsistenciaQR IE N.° 0162 SAN JOSÉ OBRERO
// ══════════════════════════════════════════════════════════════════
// INSTRUCCIONES DE DESPLIEGUE:
//   Este archivo debe estar en la RAÍZ del servidor, al mismo nivel
//   que index.html. Si está en una subcarpeta, el scope se limitará
//   a esa carpeta y no funcionará correctamente.
//
// Para forzar actualización en producción: cambia el nombre del CACHE
//   (ej: 'asistencia-qr-0162-v2') y los usuarios recibirán la nueva versión.
// ══════════════════════════════════════════════════════════════════

const CACHE = 'asistencia-qr-0162-v1';

// Recursos del app shell que se cachean en la instalación
const ASSETS = [
  self.location.pathname.replace('sw.js', '') || '/',
  self.location.pathname.replace('sw.js', 'index.html') || '/index.html'
];

// ── INSTALL: precachear el app shell ──────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés anteriores ───────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia de red ──────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Firebase, CDN y fuentes externas: siempre desde red (no se cachean)
  const esExterno = [
    'firebasejs', 'googleapis', 'gstatic',
    'firebaseio', 'jsdelivr', 'fonts.'
  ].some(d => url.includes(d));

  if (esExterno) {
    // Red primero, caché como fallback de emergencia
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell: red primero, actualizar caché, caché como fallback offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Solo cachear respuestas válidas
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
