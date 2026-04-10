// Service Worker for Web Push Notifications and PWA Installability

// Standard PWA lifecycle events
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// A fetch handler is REQUIRED for the browser to consider the site installable as a PWA.
// We implement a simple cache-first strategy for the manifest and icons to ensure reliability.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Cache manifest and icons
    if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/') || url.pathname === '/favicon.png') {
        event.respondWith(
            caches.open('pwa-assets').then((cache) => {
                return cache.match(event.request).then((response) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return response || fetchPromise;
                });
            })
        );
        return;
    }

    // Default fetch behavior for everything else
});

self.addEventListener('push', (event) => {
    let data = { title: 'BuyLocal', body: 'New notification from BuyLocal' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/logo192.png', // Fallback to PWA icon
        badge: '/badge.png',  // Small monochrome icon
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const clickAction = event.notification.data.url;

    event.waitUntil(
        // eslint-disable-next-line no-undef
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === clickAction && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(clickAction);
            }
        })
    );
});
