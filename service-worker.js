// ═══════════════════════════════════════════════════════════════════
// Service Worker - Cache optimizado para Tomos Bot
// ═══════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'tomos-bot-v1.0.0';
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

// Archivos estáticos para cachear en la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/layout.css',
  '/css/sidebar.css',
  '/css/header.css',
  '/css/modals.css',
  '/css/dashboard.css',
  '/css/dashboard2.css',
  '/css/chat.css',
  '/css/widget.css',
  '/css/knowledge.css',
  '/css/leads.css',
  '/css/login.css',
  '/css/templates.css',
  '/logo.svg',
  '/favicon.ico',
  '/js/core/firebase-config.js',
  '/js/core/listeners-manager.js',
  '/js/core/translation-loader.js',
  '/js/core/firebase-paginator.js'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('⚠️ Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('❌ Cache failed:', err))
  );
});

// Activación y limpieza de cachés viejos
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Tomar control inmediatamente
      self.clients.claim()
    ])
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar Firebase y APIs externas (siempre ir a la red)
  if (
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('firebase.com') ||
    url.hostname.includes('chrome-extension')
  ) {
    return;
  }
  
  // Estrategia para archivos estáticos: Cache First
  if (
    request.url.includes('/css/') ||
    request.url.includes('/js/core/') ||
    request.url.includes('/logo.svg') ||
    request.url.includes('/favicon')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Served from cache:', url.pathname);
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              // Cachear la respuesta nueva
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              }
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // Estrategia para traducciones: Cache First con actualización en background
  if (request.url.includes('/translations/')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // Estrategia para el resto: Network First con fallback a cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cachear imágenes y otros recursos
        if (
          networkResponse && 
          networkResponse.status === 200 &&
          (
            request.url.includes('.png') ||
            request.url.includes('.jpg') ||
            request.url.includes('.svg') ||
            request.url.includes('.woff')
          )
        ) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla, intentar servir desde caché
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📦 Served from cache (offline):', url.pathname);
              return cachedResponse;
            }
            
            // Si es una página HTML, mostrar página offline
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Mensaje desde la página
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CACHE_CLEARED'
          });
        });
      })
    );
  }
});

console.log('✅ Service Worker loaded');
