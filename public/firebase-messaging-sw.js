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

console.log('[SW] 🚀 Service Worker v18 - Zap with Message');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// Intercept push and show custom notification with actions
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || '🚨 EMERGÊNCIA SOS';
    const body = notification.body || data.body || 'Clique para ver localização';

    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground app
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    // Build actions array
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
        silent: false, // Try to enable sound
        data: {
            mapUrl: mapUrl,
            phone: phone,
            whatsappMessage: data.whatsappMessage || ''
        },
        actions: actions
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
});

// CLICK HANDLER - Zap button or body click for map
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action;

    let urlToOpen;

    if (action === 'zap' && data.phone) {
        let phone = data.phone;
        if (!phone.startsWith('55')) {
            phone = '55' + phone;
        }

        let zapUrl = `https://wa.me/${phone}`;

        // Add pre-filled message if available
        if (data.whatsappMessage) {
            const encodedMsg = encodeURIComponent(data.whatsappMessage);
            zapUrl += `?text=${encodedMsg}`;
        }

        urlToOpen = zapUrl;
    } else {
        // Body click or any other action -> Map
        urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';
    }

    console.log('[SW v18] Action:', action, '-> Opening:', urlToOpen);

    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});

messaging.onBackgroundMessage((payload) => {
    // Already handled by push event above
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
