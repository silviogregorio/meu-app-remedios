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

console.log('[SW] 🚀 Service Worker v9 - Phone Display & Fixes');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';

    // FORMAT BODY WITH PHONE
    let body = data.body || 'Clique para ver localização';
    // Phone is already in body from backend
    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, ''); // Digits only for actions

    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    const actions = [
        { action: 'action_map_v2', title: '🗺️ ABRIR MAPA' }
    ];

    if (phone) {
        actions.push({ action: 'action_whatsapp_v2', title: '💬 WHATSAPP' });
    }

    // REMOVED 'Dismiss' button as requested

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

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Clicked:', event.action);
    event.notification.close();

    const data = event.notification.data || {};
    let urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';

    if (event.action === 'action_whatsapp_v2' && data.phone) {
        let phone = data.phone;
        if (phone.length <= 11 && !phone.startsWith('55')) {
            phone = '55' + phone;
        }
        urlToOpen = `https://wa.me/${phone}`;
    } else if (event.action === 'action_map_v2') {
        urlToOpen = data.mapUrl; // Explicitly Map
    }
    // Else (generic body click) -> defaults to mapUrl

    // FORCE OPEN NEW WINDOW - To prevent overwriting the app tab
    // User feedback: "opens map on top of app, is this good?" -> No, keep app open.
    event.waitUntil(
        clients.openWindow(urlToOpen)
            .then(windowClient => {
                console.log('[SW] ✅ Opened in new window:', windowClient);
            })
            .catch(err => {
                console.error('[SW] Failed to open window:', err);
            })
    );
});

messaging.onBackgroundMessage((payload) => {
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
