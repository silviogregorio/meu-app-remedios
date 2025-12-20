importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCEcfvEqplRdSnniCdq4ZfwwbXnRiexiv0",
    authDomain: "sig-remedios.firebaseapp.com",
    projectId: "sig-remedios",
    storageBucket: "sig-remedios.firebasestorage.app",
    messagingSenderId: "723963576474",
    appId: "1:723963576474:web:84d2d1098aebfe355a5f23"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[SW] 🚀 Service Worker v4 - Full Background Support');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// Store the map URL globally for click handling
let lastMapUrl = '/';

// FIREBASE BACKGROUND MESSAGE HANDLER
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 🔔 Background message:', payload);

    const title = payload.notification?.title || payload.data?.title || '🚨 EMERGÊNCIA SOS';
    const body = payload.notification?.body || payload.data?.body || 'Clique para ver detalhes';
    const mapUrl = payload.data?.mapUrl || payload.fcmOptions?.link || '/';
    const imageUrl = payload.notification?.image || payload.data?.imageUrl || '/logo192.png';

    lastMapUrl = mapUrl;

    // Broadcast to main app
    broadcastChannel.postMessage({ type: 'FCM_PUSH', title, body, mapUrl });

    // Show notification with all data
    return self.registration.showNotification(title, {
        body: body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        image: imageUrl,
        tag: 'sos-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300],
        data: {
            mapUrl: mapUrl,
            type: 'sos'
        }
    });
});

// NATIVE PUSH EVENT (fallback)
self.addEventListener('push', (event) => {
    console.log('[SW] 📨 Push event:', event);

    if (!event.data) return;

    try {
        const payload = event.data.json();
        console.log('[SW] 📦 Payload:', payload);

        const title = payload.notification?.title || payload.data?.title || '🚨 SOS';
        const body = payload.notification?.body || payload.data?.body || 'Alerta de emergência';
        const mapUrl = payload.data?.mapUrl || payload.fcmOptions?.link || '/';
        const imageUrl = payload.notification?.image || '/logo192.png';

        lastMapUrl = mapUrl;

        event.waitUntil(
            self.registration.showNotification(title, {
                body: body,
                icon: '/logo192.png',
                badge: '/logo192.png',
                image: imageUrl,
                tag: 'sos-' + Date.now(),
                renotify: true,
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 300],
                data: { mapUrl: mapUrl }
            })
        );
    } catch (e) {
        console.error('[SW] ❌ Push parse error:', e);
    }
});

// NOTIFICATION CLICK - Open Google Maps
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Click event');
    event.notification.close();

    // Get URL from notification data or use stored lastMapUrl
    const mapUrl = event.notification.data?.mapUrl || lastMapUrl || '/';

    console.log('[SW] 🗺️ Opening:', mapUrl);

    // Handle action button clicks
    if (event.action === 'open_map') {
        event.waitUntil(clients.openWindow(mapUrl));
        return;
    }

    if (event.action === 'dismiss') {
        return;
    }

    // Default click - open the map URL
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Try to find an existing window and navigate it
            for (const client of windowClients) {
                if ('navigate' in client) {
                    return client.navigate(mapUrl).then(() => client.focus());
                }
            }
            // No window found, open new one
            return clients.openWindow(mapUrl);
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
});
