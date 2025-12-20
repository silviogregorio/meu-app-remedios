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

console.log('[SW] 🚀 Service Worker v15 - Simplified Actions');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    const body = data.body || 'Clique para ver localização';

    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    // SIMPLIFIED: Only one action button (Zap) if phone exists
    // Body click ALWAYS opens Map
    const actions = [];
    if (phone) {
        actions.push({ action: 'zap', title: '💬 Zap' });
    }

    const notificationOptions = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [300, 100, 300, 100, 300],
        tag: 'sos-emergency',
        renotify: true,
        requireInteraction: true,
        silent: false, // Ensure sound
        data: {
            mapUrl: mapUrl,
            phone: phone
        },
        actions: actions
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
});

// CLICK HANDLER - Ultra simple
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action;

    let urlToOpen;

    // If ZAP button clicked AND phone exists -> WhatsApp
    // EVERYTHING ELSE -> Map
    if (action === 'zap' && data.phone) {
        let phone = data.phone;
        if (!phone.startsWith('55')) {
            phone = '55' + phone;
        }
        urlToOpen = `https://wa.me/${phone}`;
    } else {
        // Body click, any other action, or missing phone -> Map
        urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';
    }

    console.log('[SW v15] Action:', action, '-> Opening:', urlToOpen);

    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});

messaging.onBackgroundMessage((payload) => {
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
