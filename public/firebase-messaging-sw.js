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

console.log('[SW] 🚀 Service Worker v5 - Single Handler');

// BroadcastChannel for foreground communication
const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// SINGLE HANDLER - Firebase onBackgroundMessage handles DATA-ONLY messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📨 Message received:', JSON.stringify(payload));

    // Extract data from the data-only message
    const data = payload.data || {};
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    const body = data.body || 'Clique para ver localização';
    const mapUrl = data.mapUrl || '/';
    const imageUrl = data.image || '/logo192.png';

    console.log('[SW] 🗺️ Map URL:', mapUrl);

    // Broadcast to foreground app
    broadcastChannel.postMessage({
        type: 'FCM_PUSH',
        title,
        body,
        mapUrl,
        data
    });

    // Show notification with click data
    const options = {
        body: body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        image: imageUrl,
        tag: 'sos-alert',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        data: {
            mapUrl: mapUrl,
            url: mapUrl
        }
    };

    console.log('[SW] 🔔 Showing notification with options:', JSON.stringify(options));

    return self.registration.showNotification(title, options);
});

// NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Notification clicked!');
    console.log('[SW] 📦 Notification data:', JSON.stringify(event.notification.data));

    event.notification.close();

    // Get the map URL from notification data
    const notificationData = event.notification.data || {};
    const mapUrl = notificationData.mapUrl || notificationData.url || '/';

    console.log('[SW] 🗺️ Opening URL:', mapUrl);

    // Open the URL
    event.waitUntil(
        clients.openWindow(mapUrl).then((windowClient) => {
            console.log('[SW] ✅ Window opened:', windowClient);
        }).catch((error) => {
            console.error('[SW] ❌ Failed to open window:', error);
        })
    );
});

// Log when SW is activated
self.addEventListener('activate', (event) => {
    console.log('[SW] ✅ Service Worker v5 activated');
    event.waitUntil(clients.claim());
});
