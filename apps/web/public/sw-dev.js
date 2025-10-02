// public/sw-dev.js
const CACHE_VERSION = 'dev-2.1.0';
const CACHE_NAME = `blackrent-dev-v${CACHE_VERSION}`;

// DEV MODE: Minimálne kešovanie
const CRITICAL_ASSETS = [
  '/offline.html',
  '/manifest.json'
];

// Install - len kritické assety
self.addEventListener('install', event => {
  console.log('🔧 DEV SW: Installing with minimal cache...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Fetch - BYPASS cache pre všetko okrem kritických
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Len offline page a manifest
  if (request.url.includes('offline.html') || request.url.includes('manifest.json')) {
    event.respondWith(
      caches.match(request).then(response => response || fetch(request))
    );
  } else {
    // Všetko ostatné - PRIAMO zo siete (no cache)
    event.respondWith(fetch(request));
  }
});

// Push notifications - ZACHOVANÉ
self.addEventListener('push', event => {
  // Plná funkcionalita push notifications
  if (!event.data) return;
  
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png'
    })
  );
});

// Activate - vyčistenie starých cache
self.addEventListener('activate', event => {
  console.log('🔧 DEV SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ DEV SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ DEV SW: Activated with minimal caching for fast HMR');
      return self.clients.claim();
    })
  );
});

// Message handling - pre komunikáciu s aplikáciou
self.addEventListener('message', event => {
  const { type } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      });
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
  }
});
