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

console.log('[SW] 🚀 Service Worker v14 - Map Fix');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const data = payload.data || payload;
    const title = data.title || '🚨 EMERGÊNCIA SOS';
    let body = data.body || 'Clique para ver localização';

    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    // ACTIONS: Mapa PRIMEIRO, Zap DEPOIS (se tiver telefone)
    const actions = [];

    // SEMPRE adicionar Mapa primeiro
    actions.push({ action: 'MAPA', title: '📍 Mapa' });

    // Adicionar Zap apenas se tiver telefone
    if (phone) {
        actions.push({ action: 'ZAP', title: '💬 Zap' });
    }

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

// CLICK HANDLER - Ultra explicit with switch
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action || '';

    console.log('[SW v14] Action:', action);
    console.log('[SW v14] MapUrl:', data.mapUrl);
    console.log('[SW v14] Phone:', data.phone);

    let urlToOpen;

    switch (action) {
        case 'ZAP':
            // WhatsApp
            if (data.phone) {
                let phone = data.phone;
                if (phone.length <= 11 && !phone.startsWith('55')) {
                    phone = '55' + phone;
                }
                urlToOpen = `https://wa.me/${phone}`;
            } else {
                urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';
            }
            break;

        case 'MAPA':
            // Google Maps - EXPLICIT
            urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';
            break;

        default:
            // Body click or unknown action -> Mapa
            urlToOpen = data.mapUrl || 'https://sigremedios.vercel.app';
            break;
    }

    console.log('[SW v14] Opening URL:', urlToOpen);

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
