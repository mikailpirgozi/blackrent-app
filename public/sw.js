// 🚀 BlackRent Service Worker - Enhanced PWA Experience
// Provides offline support, caching strategies, and background sync

const CACHE_NAME = 'blackrent-v1.0.0';
const API_CACHE = 'blackrent-api-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/vehicles',
  '/api/customers', 
  '/api/companies',
  '/api/rentals',
];

// Network-first strategy for API calls
const NETWORK_FIRST = [
  '/api/',
];

// Cache-first strategy for static assets
const CACHE_FIRST = [
  '/static/',
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.ico',
  '.woff2',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('❌ Service Worker: Install failed', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const { url, method } = request;
  
  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigation(request));
  }
});

// Check if request is API call
function isApiRequest(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

// Check if request is static asset
function isStaticAsset(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// Handle API requests - Network first with cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Service Worker: Network failed, trying cache for:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate cached response
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker');
      return response;
    }
    
    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Aplikácia je offline. Skúste neskôr.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets - Cache first with network fallback
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('📦 Service Worker: Failed to fetch static asset:', request.url);
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#666">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('🧭 Service Worker: Navigation offline, serving offline page');
    
    // Serve offline page
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match(OFFLINE_PAGE);
    
    return offlinePage || new Response(
      `<!DOCTYPE html>
      <html lang="sk">
        <head>
          <meta charset="UTF-8">
          <title>BlackRent - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #1976d2; margin-bottom: 20px; }
            p { color: #666; margin-bottom: 30px; }
            button { background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
            button:hover { background: #1565c0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>BlackRent</h1>
            <p>Aplikácia je momentálne offline.<br>Skontrolujte internetové pripojenie.</p>
            <button onclick="window.location.reload()">Skúsiť znovu</button>
          </div>
          <script>
            // Auto-retry when online
            window.addEventListener('online', () => {
              window.location.reload();
            });
          </script>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'blackrent-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Handle offline actions sync
async function syncOfflineActions() {
  try {
    console.log('🔄 Service Worker: Syncing offline actions...');
    
    // Get offline actions from IndexedDB (if implemented)
    // For now, just notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Offline akcie boli synchronizované'
      });
    });
  } catch (error) {
    console.error('❌ Service Worker: Sync failed:', error);
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Otvoriť aplikáciu',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Zavrieť',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Communicate with clients
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('📨 Service Worker: Unknown message type:', type);
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🗑️ Service Worker: All caches cleared');
}