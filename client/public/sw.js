/**
 * FarmLink Service Worker
 * =======================
 * This service worker provides offline support and caching for the PWA.
 * 
 * WHAT IS A SERVICE WORKER?
 * -------------------------
 * A service worker is a JavaScript file that runs in the background, separate
 * from the web page. It can intercept network requests, cache resources, and
 * enable offline functionality.
 * 
 * CACHING STRATEGIES USED:
 * ------------------------
 * 1. STATIC CACHE: Pre-cached essential assets during installation
 * 2. DYNAMIC CACHE: Caches resources as they're requested
 * 
 * FETCH STRATEGIES:
 * -----------------
 * - API Requests (/api/*): Network-first (always try server first)
 * - Page Navigations: Network-first, fallback to cache, then offline page
 * - Assets (JS/CSS/Images): Cache-first, update cache in background
 * 
 * FEATURES:
 * ---------
 * - Offline page support (shows offline.html when no network)
 * - Background sync for pending bookings and messages
 * - Push notification handling
 * - Automatic cache cleanup on version updates
 * 
 * VERSION MANAGEMENT:
 * -------------------
 * Update the version numbers below when making changes.
 * Old caches will be automatically deleted during activation.
 * 
 * @author FarmLink Development Team
 */

// ============================================
// CACHE CONFIGURATION
// ============================================

// Cache version names - update these when making changes
const CACHE_NAME = 'farmlink-v1';          // Main cache identifier
const STATIC_CACHE = 'farmlink-static-v1';  // For pre-cached essential assets
const DYNAMIC_CACHE = 'farmlink-dynamic-v1'; // For dynamically cached resources

// List of assets to pre-cache during installation
// These will be available immediately, even offline
const STATIC_ASSETS = [
    '/',              // Home page
    '/index.html',    // Main HTML file
    '/manifest.json', // PWA manifest
    '/offline.html'   // Offline fallback page
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests from caching (always go to network)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Return cached response if available for GET API requests
                    return caches.match(request);
                })
        );
        return;
    }

    // For page navigations, use network-first strategy
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the response
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Try cache, then offline page
                    return caches.match(request)
                        .then((cachedResponse) => {
                            return cachedResponse || caches.match('/offline.html');
                        });
                })
        );
        return;
    }

    // For other assets (JS, CSS, images), use cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version, but also update cache in background
                    fetch(request).then((response) => {
                        if (response.ok) {
                            caches.open(DYNAMIC_CACHE).then((cache) => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => { });
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Cache the response for future
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return placeholder for images
                        if (request.destination === 'image') {
                            return caches.match('/icons/placeholder.png');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Sync pending bookings
async function syncBookings() {
    try {
        const cache = await caches.open('pending-bookings');
        const requests = await cache.keys();

        for (const request of requests) {
            const response = await cache.match(request);
            const data = await response.json();

            try {
                await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                await cache.delete(request);
            } catch (error) {
                console.error('[Service Worker] Failed to sync booking:', error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Sync bookings error:', error);
    }
}

// Sync pending messages
async function syncMessages() {
    try {
        const cache = await caches.open('pending-messages');
        const requests = await cache.keys();

        for (const request of requests) {
            const response = await cache.match(request);
            const data = await response.json();

            try {
                await fetch('/api/messages/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                await cache.delete(request);
            } catch (error) {
                console.error('[Service Worker] Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('[Service Worker] Sync messages error:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'New notification from FarmLink',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'FarmLink', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if a window is already open
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none found
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

console.log('[Service Worker] FarmLink SW loaded');
