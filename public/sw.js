/**
 * Service Worker for NoMo Phone
 *
 * Provides offline support by caching essential assets and API responses.
 * Uses a cache-first strategy for static assets and network-first for API calls.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `nomo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nomo-dynamic-${CACHE_VERSION}`;
const API_CACHE = `nomo-api-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API patterns to cache with network-first strategy
const API_PATTERNS = [
  /\/rest\/v1\//,
];

// Skip caching for these patterns
const SKIP_CACHE_PATTERNS = [
  /\/auth\//,
  /supabase\.co\/auth/,
  /realtime/,
  /\.hot-update\./,
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('nomo-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== API_CACHE;
            })
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Check if request should skip caching
 */
function shouldSkipCache(request) {
  const url = request.url;
  return SKIP_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if request is an API call
 */
function isApiRequest(request) {
  const url = request.url;
  return API_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

/**
 * Network-first strategy for API calls
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw _error;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Revalidation failed silently - cached response is still valid
    });

  return cachedResponse || fetchPromise;
}

/**
 * Fetch event - handle requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip caching for certain patterns
  if (shouldSkipCache(request)) {
    return;
  }

  // API requests use network-first
  if (isApiRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets and navigation use cache-first
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // JS, CSS, images use cache-first
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/**
 * Message event - handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(
          names.filter((name) => name.startsWith('nomo-'))
               .map((name) => caches.delete(name))
        );
      })
    );
  }
});

/**
 * Sync event - handle background sync when back online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(
      // The main app handles the actual sync via useOfflineSyncManager
      // This just ensures the app wakes up to process pending data
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_REQUESTED' });
        });
      })
    );
  }
});
