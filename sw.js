/**
 * Service Worker for Transpose MP3 Library
 * Caches app shell and optionally prefetched tracks
 */

const CACHE_VERSION = 'transpose-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/app.js',
    '/public/tracks.manifest.json',
    // CDN resources (may be cached by browser already)
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js'
];

// Install event - cache app shell
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(APP_SHELL.map(url => new Request(url, {
                    cache: 'reload'
                })));
            })
            .catch(error => {
                console.error('[SW] Failed to cache app shell:', error);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_VERSION)
                        .map(cacheName => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle MP3 files specially - network first, then cache
    if (url.pathname.endsWith('.mp3')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Clone the response before caching
                    const responseClone = response.clone();
                    
                    // Optionally cache MP3s (can be large, be careful)
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(request, responseClone);
                    });
                    
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }
    
    // For app shell resources - cache first, fallback to network
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetch(request)
                        .then(networkResponse => {
                            caches.open(CACHE_VERSION).then(cache => {
                                cache.put(request, networkResponse);
                            });
                        })
                        .catch(() => {
                            // Network failed, but we have cache
                        });
                    
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(request)
                    .then(response => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_VERSION).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});

// Message event - allow clients to communicate with SW
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_VERSION)
                .then(() => {
                    console.log('[SW] Cache cleared');
                })
        );
    }
    
    if (event.data && event.data.type === 'CACHE_TRACK') {
        const trackUrl = event.data.url;
        event.waitUntil(
            caches.open(CACHE_VERSION)
                .then(cache => cache.add(trackUrl))
                .then(() => {
                    console.log('[SW] Cached track:', trackUrl);
                })
        );
    }
});

