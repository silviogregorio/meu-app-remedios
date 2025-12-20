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

console.log('[SW] 🚀 Service Worker v8.1 - WhatsApp Action');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// NATIVE PUSH EVENT - Handles DATA-ONLY messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    const body = data.body || 'Clique para ver localização';
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const phone = data.phone ? data.phone.replace(/\D/g, '') : '';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    const actions = [
        { action: 'open_map', title: '🗺️ ABRIR MAPA' }
    ];

    if (phone) {
        actions.push({ action: 'whatsapp', title: '💬 WHATSAPP' });
    }

    // Always options to close
    actions.push({ action: 'dismiss', title: 'Fechar' });

    const notificationOptions = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [300, 100, 300, 100, 300],
        tag: 'sos-' + Date.now(),
        renotify: true,
        requireInteraction: true,
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

// NOTIFICATION CLICK - Robust handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') return;

    const data = event.notification.data || {};
    let urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';

    // WhatsApp Action
    if (event.action === 'whatsapp' && data.phone) {
        // Ensure 55 for Brazil if missing
        let phone = data.phone;
        if (phone.length <= 11 && !phone.startsWith('55')) {
            phone = '55' + phone;
        }
        urlToOpen = `https://wa.me/${phone}`;
    }

    console.log('[SW] Opening:', urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // 1. Try to find existing window and focus/navigate
                for (let client of windowClients) {
                    if (client.url.includes('sigremedios.vercel.app') && 'focus' in client) {
                        if (event.action === 'whatsapp') {
                            // For WhatsApp, better to use openWindow so we don't navigate the app away
                            return clients.openWindow(urlToOpen);
                        } else {
                            // For Map, we can navigate the app or open new window
                            // Let's open new window to keep app state safe
                            return clients.openWindow(urlToOpen);
                        }
                    }
                }
                // 2. Open new window if no match
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch(err => console.error('[SW] Click failed:', err))
    );
});

// Background message handler (fallback)
messaging.onBackgroundMessage((payload) => {
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
