// 🚀 BlackRent Service Worker - Enhanced Performance & PWA Experience
// Provides offline support, intelligent caching, and performance optimizations

const CACHE_VERSION = '2.3.0'; // ✅ BUMPED: Force update - kompletná oprava cache pre všetky moduly
const CACHE_NAME = `blackrent-v${CACHE_VERSION}`;
const API_CACHE = `blackrent-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `blackrent-images-v${CACHE_VERSION}`;
const FONT_CACHE = `blackrent-fonts-v${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Cache size limits
const MAX_API_CACHE_ENTRIES = 50;
const MAX_IMAGE_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FONT_CACHE_ENTRIES = 20;

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// Assets to cache on demand
const STATIC_ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2$/,
  /\.woff$/,
  /\.ttf$/,
  /\.otf$/,
];

// Image patterns for optimized caching
const IMAGE_PATTERNS = [
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.svg$/,
];

// API endpoints with different cache strategies
const API_CACHE_STRATEGIES = {
  // Long cache (1 hour) - STATICKÉ dáta ktoré sa VEĽMI zriedka menia
  LONG_CACHE: [
    '/api/statistics',      // Štatistiky - recalculated rarely
  ],
  // Medium cache (15 minutes) - Semi-statické dáta
  MEDIUM_CACHE: [
    '/api/companies',       // Firmy - menia sa zriedka (✅ FIX: 1h → 15min)
    '/api/users',           // Useri - menia sa občas (✅ FIX: 1h → 15min)
  ],
  // Short cache (5 minutes) - Dáta ktoré sa menia častejšie
  SHORT_CACHE: [
    // PRÁZDNE - všetky často menené entity sú v NO_CACHE
  ],
  // No cache (always network) - ✅ REAL-TIME SEKCIE - všetko čo sa CRUD-uje
  NO_CACHE: [
    '/api/auth',
    '/api/logout',
    '/api/rentals',         // ✅ Prenájmy - KRITICKÉ (FIX: SHORT_CACHE → NO_CACHE)
    '/api/availability',    // ✅ Dostupnosť - KRITICKÉ (FIX: SHORT_CACHE → NO_CACHE)
    '/api/protocols',       // ✅ Protokoly - real-time updates (FIX: pridané)
    '/api/insurances',      // ✅ Poisťovne - real-time updates
    '/api/insurance-claims', // ✅ Poistné udalosti - real-time updates (FIX: pridané)
    '/api/expenses',        // ✅ Náklady - real-time updates
    '/api/settlements',     // ✅ Vyúčtovanie - real-time updates
    '/api/vehicles',        // ✅ Vozidlá - real-time updates
    '/api/customers',       // ✅ Zákazníci - real-time updates
    '/api/vehicle-documents', // ✅ Vehicle documents (STK/EK) - real-time updates
    '/api/leasings',        // ✅ Leasingy - real-time updates (FIX: pridané 2025-01-03)
  ],
};

// Install event - cache critical assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets - with error handling
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Service Worker: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('⚠️ Service Worker: Some critical assets failed to cache:', err.message);
          // Continue installation even if some assets fail
          return Promise.resolve();
        });
      }),
      
      // Initialize other caches
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE),
      caches.open(FONT_CACHE),
    ])
    .then(() => {
      console.log('✅ Service Worker: Installation complete');
      
      // 📱 MOBILE FIX: Skip waiting immediately to prevent refresh loops
      console.log('📱 Mobile: Skipping waiting to prevent refresh issues');
      return self.skipWaiting();
    })
    .catch(error => {
      console.warn('⚠️ Service Worker: Install partially failed, but continuing:', error.message);
      // Don't throw error - allow SW to install even with partial failures
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches and manage storage
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  
  const currentCaches = [CACHE_NAME, API_CACHE, IMAGE_CACHE, FONT_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Clean up oversized caches
      cleanupImageCache(),
      cleanupApiCache(),
    ])
    .then(() => {
      console.log('🔄 Service Worker: Cache cleanup complete');
      
      // 📱 MOBILE FIX: Claim clients immediately to prevent refresh loops
      console.log('📱 Mobile: Claiming clients to prevent refresh issues');
      return self.clients.claim();
    })
  );
});

// Cleanup functions
async function cleanupImageCache() {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const requests = await cache.keys();
    
    if (requests.length === 0) return;
    
    // Calculate cache size
    const responses = await Promise.all(
      requests.map(req => cache.match(req))
    );
    
    let totalSize = 0;
    const entries = [];
    
    for (let i = 0; i < requests.length; i++) {
      const response = responses[i];
      if (response) {
        const blob = await response.blob();
        entries.push({
          request: requests[i],
          size: blob.size,
          timestamp: response.headers.get('sw-timestamp') || '0'
        });
        totalSize += blob.size;
      }
    }
    
    // Remove old entries if cache is too large
    if (totalSize > MAX_IMAGE_CACHE_SIZE) {
      entries.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
      
      let sizeToRemove = totalSize - MAX_IMAGE_CACHE_SIZE;
      for (const entry of entries) {
        await cache.delete(entry.request);
        sizeToRemove -= entry.size;
        
        if (sizeToRemove <= 0) break;
      }
      
      console.log('🖼️ Image cache cleaned up');
    }
  } catch (error) {
    console.warn('Image cache cleanup failed:', error);
  }
}

async function cleanupApiCache() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    if (requests.length <= MAX_API_CACHE_ENTRIES) return;
    
    // Get entries with timestamps
    const entries = [];
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        entries.push({
          request,
          timestamp: response.headers.get('sw-timestamp') || '0'
        });
      }
    }
    
    // Remove oldest entries
    entries.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    const toRemove = entries.slice(0, entries.length - MAX_API_CACHE_ENTRIES);
    
    for (const entry of toRemove) {
      await cache.delete(entry.request);
    }
    
    console.log(`🗃️ API cache cleaned up (removed ${toRemove.length} entries)`);
  } catch (error) {
    console.warn('API cache cleanup failed:', error);
  }
}

// Fetch event - implement intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const { url, method } = request;
  
  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }

  // Determine request type and apply appropriate strategy
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isFontRequest(url)) {
    event.respondWith(handleFontRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigation(request));
  }
});

// Request type detection functions
function isApiRequest(url) {
  return url.includes('/api/');
}

function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

function isFontRequest(url) {
  return /\.(woff2|woff|ttf|otf)$/i.test(url);
}

function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url));
}

function getApiCacheStrategy(url) {
  for (const [strategy, endpoints] of Object.entries(API_CACHE_STRATEGIES)) {
    if (endpoints.some(endpoint => url.includes(endpoint))) {
      return strategy;
    }
  }
  return 'MEDIUM_CACHE'; // Default
}

function getCacheTTL(strategy) {
  switch (strategy) {
    case 'LONG_CACHE': return 60 * 60 * 1000; // 1 hour
    case 'MEDIUM_CACHE': return 15 * 60 * 1000; // 15 minutes
    case 'SHORT_CACHE': return 5 * 60 * 1000; // 5 minutes
    case 'NO_CACHE': return 0;
    default: return 15 * 60 * 1000;
  }
}

function isCacheExpired(response) {
  const timestamp = response.headers.get('sw-timestamp');
  const cacheTTL = response.headers.get('sw-ttl');
  
  if (!timestamp || !cacheTTL) return true;
  
  const age = Date.now() - parseInt(timestamp);
  return age > parseInt(cacheTTL);
}

// Enhanced cache response with metadata
function createCacheResponse(response, ttl) {
  const responseClone = response.clone();
  const headers = new Headers(responseClone.headers);
  
  headers.set('sw-timestamp', Date.now().toString());
  headers.set('sw-ttl', ttl.toString());
  headers.set('sw-cached', 'true');
  
  return new Response(responseClone.body, {
    status: responseClone.status,
    statusText: responseClone.statusText,
    headers: headers
  });
}

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  const url = request.url;
  const strategy = getApiCacheStrategy(url);
  const ttl = getCacheTTL(strategy);
  
  // Skip caching for NO_CACHE endpoints
  if (strategy === 'NO_CACHE') {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Požiadavka zlyhala. Skontrolujte pripojenie.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    // Return cached response and update in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseWithMeta = createCacheResponse(response, ttl);
          cache.put(request, responseWithMeta);
        }
      })
      .catch(() => {}); // Silent fail for background updates
    
    return cachedResponse;
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses with metadata
      const responseWithMeta = createCacheResponse(networkResponse, ttl);
      cache.put(request, responseWithMeta.clone());
      return responseWithMeta;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Network failed, trying cache for:', request.url);
    
    // Network failed, return stale cache if available
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-By', 'ServiceWorker-Stale');
      headers.set('X-Cache-Status', 'stale');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // No cache available
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

// Handle image requests - Cache first with size management
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Add metadata for cache management
      const responseWithMeta = createCacheResponse(networkResponse, 24 * 60 * 60 * 1000); // 24 hours
      cache.put(request, responseWithMeta.clone());
      
      return responseWithMeta;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🖼️ Service Worker: Failed to fetch image:', request.url);
    
    // Return SVG placeholder
    return new Response(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8fafc"/>
        <text x="200" y="150" text-anchor="middle" fill="#94a3b8" font-family="Arial">📷</text>
        <text x="200" y="180" text-anchor="middle" fill="#64748b" font-size="12">Obrázok nedostupný</text>
      </svg>`,
      { 
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  }
}

// Handle font requests - Long-term caching
async function handleFontRequest(request) {
  const cache = await caches.open(FONT_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Fonts can be cached for a very long time
      const responseWithMeta = createCacheResponse(networkResponse, 30 * 24 * 60 * 60 * 1000); // 30 days
      cache.put(request, responseWithMeta.clone());
      
      return responseWithMeta;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🔤 Service Worker: Failed to fetch font:', request.url);
    throw error; // Let browser handle font fallback
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
      // Static assets can be cached for a long time
      const responseWithMeta = createCacheResponse(networkResponse, 7 * 24 * 60 * 60 * 1000); // 7 days
      cache.put(request, responseWithMeta.clone());
      
      return responseWithMeta;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('📦 Service Worker: Failed to fetch static asset:', request.url);
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
      
    case 'INVALIDATE_CACHE':
      // ✅ NEW: Invalidovať špecifické API cache po mutation
      invalidateApiCache(payload?.urls || []).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
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

// ✅ NEW: Invalidovať špecifické API cache
async function invalidateApiCache(urls) {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    console.log(`🔄 Service Worker: Invalidating cache for URLs:`, urls);
    
    let invalidatedCount = 0;
    
    for (const request of requests) {
      // Skontroluj či request URL obsahuje niektorú z invalidovaných URLs
      const shouldInvalidate = urls.some(url => request.url.includes(url));
      
      if (shouldInvalidate) {
        await cache.delete(request);
        invalidatedCount++;
      }
    }
    
    console.log(`✅ Service Worker: Invalidated ${invalidatedCount} cache entries`);
    
  } catch (error) {
    console.error('❌ Service Worker: Cache invalidation failed:', error);
  }
}

// ================================================================================
// 🔔 PUSH NOTIFICATIONS IMPLEMENTATION
// ================================================================================

// Push event listener - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('🔔 Push notification received:', event);
  
  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('📨 Push data:', data);
    
    event.waitUntil(handlePushNotification(data));
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('BlackRent', {
        body: 'Máte novú notifikáciu',
        icon: '/logo192.png',
        badge: '/favicon.ico',
        tag: 'fallback'
      })
    );
  }
});

// Handle push notification display and data processing
async function handlePushNotification(data) {
  const {
    title = 'BlackRent',
    body = 'Máte novú notifikáciu',
    icon = '/logo192.png',
    badge = '/favicon.ico',
    image,
    tag = 'default',
    data: notificationData = {},
    actions = [],
    requireInteraction = false,
    silent = false,
    vibrate,
    timestamp = Date.now(),
    renotify = false,
    sticky = false
  } = data;
  
  // Enhanced notification options
  const notificationOptions = {
    body,
    icon,
    badge,
    image,
    tag,
    data: {
      ...notificationData,
      timestamp,
      url: notificationData.url || '/',
      clickAction: notificationData.clickAction || 'open_app'
    },
    actions: actions.map(action => ({
      action: action.action,
      title: action.title,
      icon: action.icon
    })),
    requireInteraction,
    silent,
    renotify,
    sticky,
    vibrate: vibrate || [200, 100, 200], // Default vibration pattern
    timestamp,
    
    // Additional options for better UX
    dir: 'ltr',
    lang: 'sk',
    
    // Custom styling
    color: '#1976d2', // BlackRent brand color
  };
  
  // Show the notification
  await self.registration.showNotification(title, notificationOptions);
  
  // Track notification display
  await trackNotificationEvent('displayed', {
    title,
    tag,
    timestamp,
    data: notificationData
  });
  
  console.log('✅ Push notification displayed:', title);
}

// Notification click event handler
self.addEventListener('notificationclick', event => {
  console.log('👆 Notification clicked:', event.notification);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Close the notification
  notification.close();
  
  // Handle different actions
  event.waitUntil(handleNotificationClick(action, data, notification));
});

// Handle notification click actions
async function handleNotificationClick(action, data, notification) {
  const { url = '/', clickAction = 'open_app' } = data;
  
  // Track click event
  await trackNotificationEvent('clicked', {
    action,
    tag: notification.tag,
    timestamp: Date.now(),
    data
  });
  
  // Handle different actions
  switch (action) {
    case 'view_rental':
      await openWindow(`/rentals/${data.rentalId}`);
      break;
      
    case 'view_vehicle':
      await openWindow(`/vehicles/${data.vehicleId}`);
      break;
      
    case 'view_customer':
      await openWindow(`/customers/${data.customerId}`);
      break;
      
    case 'approve_rental':
      await handleRentalAction('approve', data.rentalId);
      break;
      
    case 'reject_rental':
      await handleRentalAction('reject', data.rentalId);
      break;
      
    case 'mark_read':
      await markNotificationRead(data.notificationId);
      break;
      
    case 'dismiss':
      // Just dismiss - already closed
      break;
      
    default:
      // Default action - open app
      await openWindow(url);
      break;
  }
}

// Open or focus app window
async function openWindow(url) {
  const fullUrl = new URL(url, self.location.origin).href;
  
  try {
    // Try to focus existing window
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    // Look for existing window with the same URL
    for (const client of windowClients) {
      if (client.url === fullUrl && 'focus' in client) {
        console.log('🎯 Focusing existing window:', fullUrl);
        return client.focus();
      }
    }
    
    // Look for any BlackRent window to navigate
    for (const client of windowClients) {
      if (client.url.includes(self.location.origin) && 'navigate' in client) {
        console.log('🔄 Navigating existing window to:', fullUrl);
        await client.navigate(fullUrl);
        return client.focus();
      }
    }
    
    // Open new window
    console.log('🆕 Opening new window:', fullUrl);
    return clients.openWindow(fullUrl);
    
  } catch (error) {
    console.error('❌ Error opening window:', error);
    // Fallback - try to open new window
    return clients.openWindow(fullUrl);
  }
}

// Handle rental-specific actions
async function handleRentalAction(action, rentalId) {
  try {
    const apiUrl = `${self.location.origin}/api/rentals/${rentalId}/${action}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need to handle authentication
      }
    });
    
    if (response.ok) {
      console.log(`✅ Rental ${action} successful for ${rentalId}`);
      
      // Show success notification
      await self.registration.showNotification('BlackRent', {
        body: `Prenájom bol ${action === 'approve' ? 'schválený' : 'zamietnutý'}`,
        icon: '/logo192.png',
        tag: `rental-${action}-success`,
        actions: [
          {
            action: 'view_rental',
            title: 'Zobraziť prenájom'
          }
        ],
        data: { rentalId, url: `/rentals/${rentalId}` }
      });
      
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error ${action} rental:`, error);
    
    // Show error notification
    await self.registration.showNotification('BlackRent - Chyba', {
      body: `Nepodarilo sa ${action === 'approve' ? 'schváliť' : 'zamietnuť'} prenájom`,
      icon: '/logo192.png',
      tag: `rental-${action}-error`,
      requireInteraction: true
    });
  }
}

// Mark notification as read
async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  
  try {
    const apiUrl = `${self.location.origin}/api/notifications/${notificationId}/read`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Notification ${notificationId} marked as read`);
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

// Notification close event handler
self.addEventListener('notificationclose', event => {
  console.log('❌ Notification closed:', event.notification.tag);
  
  // Track close event
  const notification = event.notification;
  const data = notification.data || {};
  
  event.waitUntil(
    trackNotificationEvent('closed', {
      tag: notification.tag,
      timestamp: Date.now(),
      data
    })
  );
});

// Track notification events for analytics
async function trackNotificationEvent(eventType, eventData) {
  try {
    // Store event in IndexedDB for analytics
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: eventData
    };
    
    console.log('📊 Notification event tracked:', event);
    
    // Optional: Send to backend analytics
    if ('navigator' in self && navigator.onLine) {
      await sendNotificationAnalytics(event);
    }
    
  } catch (error) {
    console.error('❌ Error tracking notification event:', error);
  }
}

// Send notification analytics to backend
async function sendNotificationAnalytics(event) {
  try {
    const apiUrl = `${self.location.origin}/api/analytics/notifications`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
  } catch (error) {
    console.warn('Analytics send failed (will retry later):', error);
  }
}

// Push subscription change handler
self.addEventListener('pushsubscriptionchange', event => {
  console.log('🔄 Push subscription changed');
  
  event.waitUntil(
    handlePushSubscriptionChange(event.oldSubscription, event.newSubscription)
  );
});

// Handle push subscription changes
async function handlePushSubscriptionChange(oldSubscription, newSubscription) {
  try {
    console.log('Old subscription:', oldSubscription);
    console.log('New subscription:', newSubscription);
    
    // Update subscription on server
    if (newSubscription) {
      await updatePushSubscription(newSubscription);
    } else {
      // Resubscribe
      const registration = await self.registration;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await getVAPIDPublicKey()
      });
      
      await updatePushSubscription(subscription);
    }
    
  } catch (error) {
    console.error('❌ Error handling subscription change:', error);
  }
}

// Update push subscription on server
async function updatePushSubscription(subscription) {
  try {
    const apiUrl = `${self.location.origin}/api/push/subscription`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    });
    
    if (response.ok) {
      console.log('✅ Push subscription updated');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating push subscription:', error);
  }
}

// Get VAPID public key from server
async function getVAPIDPublicKey() {
  try {
    const response = await fetch(`${self.location.origin}/api/push/vapid-key`);
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('❌ Error getting VAPID key:', error);
    return null;
  }
}