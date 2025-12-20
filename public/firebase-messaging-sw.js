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
    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, ''); // Digits only

    if (rawPhone) {
        body = `${body}\n📞 Contato: ${rawPhone}`;
    }

    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    const actions = [
        { action: 'open_map', title: '🗺️ ABRIR MAPA' }
    ];

    if (phone) {
        actions.push({ action: 'whatsapp', title: '💬 WHATSAPP' });
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

    if (event.action === 'whatsapp' && data.phone) {
        let phone = data.phone;
        if (phone.length <= 11 && !phone.startsWith('55')) {
            phone = '55' + phone;
        }
        urlToOpen = `https://wa.me/${phone}`;
    }

    // FORCE OPEN WINDOW - Most reliable method for background clicks
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if app is open
                for (let client of windowClients) {
                    if (client.url.includes('sigremedios.vercel.app') && 'focus' in client) {
                        return client.focus().then(c => {
                            // If WhatsApp, always open new window to not lose app state
                            if (event.action === 'whatsapp') {
                                return clients.openWindow(urlToOpen);
                            }
                            // If Map, navigate the focused window
                            return c.navigate(urlToOpen);
                        });
                    }
                }
                // If no app window found, open new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch(err => {
                console.error('[SW] Click failed:', err);
                // Last resort fallback
                if (clients.openWindow) clients.openWindow(urlToOpen);
            })
    );
});

messaging.onBackgroundMessage((payload) => {
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
