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

console.log('[SW] 🚀 Service Worker v6 - FCM Auto-Display');

// BroadcastChannel for foreground communication
const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// This handler is called ONLY for data-only messages
// When notification field is present, FCM auto-displays and this is NOT called
// We keep it as a fallback
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📨 onBackgroundMessage (fallback):', payload);

    // Broadcast to foreground
    broadcastChannel.postMessage({
        type: 'FCM_PUSH',
        ...payload.data
    });

    // FCM should have already displayed the notification
    // Only show if it's a data-only message (no notification field)
    if (!payload.notification) {
        const title = payload.data?.title || '🚨 SOS';
        const body = payload.data?.body || 'Emergência';

        return self.registration.showNotification(title, {
            body: body,
            icon: '/logo192.png',
            data: { mapUrl: payload.data?.mapUrl }
        });
    }
});

// NOTIFICATION CLICK - Fallback handler
// When FCM auto-displays with fcm_options.link, the click is handled by FCM
// This handler is for notifications we create ourselves
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Notification click (fallback)');
    event.notification.close();

    const mapUrl = event.notification.data?.mapUrl || '/';
    console.log('[SW] 🗺️ Opening:', mapUrl);

    event.waitUntil(clients.openWindow(mapUrl));
});

self.addEventListener('activate', (event) => {
    console.log('[SW] ✅ Service Worker v6 activated');
    event.waitUntil(clients.claim());
});
