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

console.log('[SW] 🚀 Service Worker v8 - Robust Click Handler');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// NATIVE PUSH EVENT - Handles DATA-ONLY messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
        console.log('[SW] 📦 Payload:', payload);
    } catch (e) { return; }

    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    const body = data.body || 'Clique para ver localização';
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    const notificationOptions = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [300, 100, 300, 100, 300],
        tag: 'sos-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: { mapUrl: mapUrl },
        actions: [
            { action: 'open_map', title: '🗺️ ABRIR MAPA' },
            { action: 'dismiss', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
});

// NOTIFICATION CLICK - Robust handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') return;

    const mapUrl = event.notification.data?.mapUrl || 'https://sigremedios.vercel.app';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // 1. Try to find existing window and focus/navigate
                for (let client of windowClients) {
                    if (client.url.includes('sigremedios.vercel.app') && 'focus' in client) {
                        return client.focus().then(c => c.navigate(mapUrl));
                    }
                }
                // 2. Open new window if no match
                if (clients.openWindow) {
                    return clients.openWindow(mapUrl);
                }
            })
            .catch(err => console.error('[SW] Click failed:', err))
    );
});

// Background message handler (fallback)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📨 onBackgroundMessage:', payload);
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
