const CACHE_NAME = 'material-icon-fetcher-v1';
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(CORE_ASSETS);
            })
    );
});

self.addEventListener('fetch', event => {
    // We only want to cache GET requests for icon data
    const isIconDataRequest = event.request.url.includes('/processed-icons/');
    const isGetRequest = event.request.method === 'GET';

    if (isIconDataRequest && isGetRequest) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    // Return from cache if found
                    if (response) {
                        return response;
                    }

                    // Otherwise, fetch from network, cache, and return
                    return fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // For non-icon data, use a standard cache-first strategy for core assets
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request);
                })
        );
    }
});
