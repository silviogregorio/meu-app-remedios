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

console.log('[SW] 🚀 Service Worker Inicializado (v3 - SDK 10.8.0)');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// FIREBASE BACKGROUND MESSAGE
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 🔔 onBackgroundMessage recebido:', payload);

    const title = payload.notification?.title || payload.data?.title || '🚨 EMERGÊNCIA SOS';
    const body = payload.notification?.body || payload.data?.body || 'Ajuda necessária!';

    broadcastChannel.postMessage({ type: 'FCM_PUSH', title, body, data: payload.data });

    const notificationOptions = {
        body: body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [300, 100, 300],
        requireInteraction: true,
        tag: 'sos-alert',
        data: payload.data || {}
    };

    return self.registration.showNotification(title, notificationOptions);
});

// NATIVE PUSH EVENT (CATCHER)
self.addEventListener('push', (event) => {
    console.log('[SW] 📨 Evento PUSH Nativo recebido!', event);

    if (event.data) {
        try {
            const json = event.data.json();
            console.log('[SW] 📦 Dados decodificados:', json);

            const title = json.notification?.title || json.data?.title || '🚨 SOS';
            const body = json.notification?.body || json.data?.body || 'Clique para ver.';

            broadcastChannel.postMessage({ type: 'FCM_PUSH', title, body, data: json.data });

            event.waitUntil(
                self.registration.showNotification(title, {
                    body: body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    vibrate: [500, 200, 500],
                    requireInteraction: true,
                    tag: 'sos-alert',
                    data: json.data || {}
                })
            );
        } catch (e) {
            console.error('[SW] ❌ Erro ao processar:', e);
            event.waitUntil(
                self.registration.showNotification('🚨 SOS ALERT', {
                    body: 'Novo alerta detectado'
                })
            );
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
