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

console.log('[SW] 🚀 Service Worker v7 - Full SW Control');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// NATIVE PUSH EVENT - Handles DATA-ONLY messages
// This gives us full control over notification display AND click action
self.addEventListener('push', (event) => {
    console.log('[SW] 📨 Push event received');

    if (!event.data) {
        console.log('[SW] No data in push event');
        return;
    }

    let payload;
    try {
        payload = event.data.json();
        console.log('[SW] 📦 Payload:', JSON.stringify(payload));
    } catch (e) {
        console.error('[SW] Failed to parse push data:', e);
        return;
    }

    // Extract data
    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    const body = data.body || 'Clique para ver localização';
    const mapUrl = data.mapUrl || '/';
    const icon = data.icon || '/logo192.png';

    console.log('[SW] 🗺️ Map URL for click:', mapUrl);

    // Broadcast to foreground app (if open)
    broadcastChannel.postMessage({
        type: 'FCM_PUSH',
        title,
        body,
        mapUrl,
        data
    });

    // Show notification with click data embedded
    const notificationOptions = {
        body: body,
        icon: icon,
        badge: '/logo192.png',
        tag: 'sos-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        data: {
            mapUrl: mapUrl,
            type: data.type || 'sos'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
            .then(() => console.log('[SW] ✅ Notification shown'))
            .catch(err => console.error('[SW] ❌ Failed to show notification:', err))
    );
});

// NOTIFICATION CLICK - Opens the map URL
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Notification clicked!');

    event.notification.close();

    const notificationData = event.notification.data || {};
    const mapUrl = notificationData.mapUrl;

    console.log('[SW] 🗺️ Map URL from notification data:', mapUrl);

    if (mapUrl && mapUrl !== '/') {
        event.waitUntil(
            clients.openWindow(mapUrl)
                .then(() => console.log('[SW] ✅ Opened:', mapUrl))
                .catch(err => console.error('[SW] ❌ Failed to open window:', err))
        );
    } else {
        // Fallback - open the app
        event.waitUntil(
            clients.openWindow('https://sigremedios.vercel.app')
        );
    }
});

// Firebase background message handler (fallback for hybrid messages)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📨 onBackgroundMessage (fallback):', payload);

    // Broadcast to foreground
    broadcastChannel.postMessage({
        type: 'FCM_PUSH',
        ...payload.data
    });

    // Only show if not already handled
    const data = payload.data || {};
    return self.registration.showNotification(
        data.title || 'SiG Remédios',
        {
            body: data.body || 'Nova notificação',
            icon: '/logo192.png',
            data: { mapUrl: data.mapUrl }
        }
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] ✅ Service Worker v7 activated');
    event.waitUntil(clients.claim());
});
