/* eslint-disable no-restricted-globals */
// Service Worker for Web Push Notifications

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
