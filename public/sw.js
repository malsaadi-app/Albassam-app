// Service Worker for Albassam Tasks PWA
// Version 2.0.0 - Fixed caching strategy for JS files

const CACHE_VERSION = 'albassam-v3';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

// Resources to precache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/logo.jpg'
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3...');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Precaching static resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Precache failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3...');
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('albassam-') && name !== CACHE_STATIC && name !== CACHE_DYNAMIC && name !== CACHE_IMAGES)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control immediately
      self.clients.claim(),
      // Notify clients of new version
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          console.log('[SW] New version active:', client.url);
          client.postMessage({ type: 'SW_UPDATED', version: 'v3' });
        });
      })
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other origins
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('http')) {
    return;
  }

  event.respondWith(
    handleFetch(request, url)
  );
});

async function handleFetch(request, url) {
  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    return networkFirst(request, CACHE_DYNAMIC);
  }

  // JavaScript files - Network first (to avoid stale code)
  if (request.destination === 'script' || /\.js$/i.test(url.pathname)) {
    return networkFirst(request, CACHE_DYNAMIC);
  }

  // CSS files - Cache first (safe to cache)
  if (request.destination === 'style' || /\.css$/i.test(url.pathname)) {
    return cacheFirst(request, CACHE_STATIC);
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    return cacheFirst(request, CACHE_IMAGES);
  }

  // Pages - Stale while revalidate
  if (request.destination === 'document' || request.mode === 'navigate') {
    return staleWhileRevalidate(request, CACHE_DYNAMIC);
  }

  // Default - Network first
  return networkFirst(request, CACHE_DYNAMIC);
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return caches.match('/offline');
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }

    // If requesting a page, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }

    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached || caches.match('/offline'));

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// Message event - handle commands from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

console.log('[SW] Service worker v3 loaded - Fixed JS caching');
