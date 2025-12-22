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

console.log('[SW] 🚀 Service Worker v19 - App Navigation');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) { return; }

    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || (data.type === 'reminder' ? '🔔 Lembrete de Cuidado' : '🚨 EMERGÊNCIA SOS');
    const body = notification.body || data.body || (data.type === 'reminder' ? '💊 Já tomou o seu remédio? Não deixe passar do horário!' : 'Clique aqui para ver a localização');

    // Configs
    const rawPhone = data.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const appUrl = data.appUrl || 'https://sigremedios.vercel.app/';
    const icon = 'https://sigremedios.vercel.app/logo192.png';

    // Broadcast to foreground
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...data });

    // Actions
    const actions = [];
    if (phone && data.type !== 'reminder') {
        actions.push({ action: 'zap', title: '💬 Zap' });
    }

    const notificationOptions = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: data.type === 'reminder' ? [100, 50, 100] : [300, 100, 300, 100, 300],
        tag: data.type === 'reminder' ? `reminder-${data.prescriptionIds || 'med'}` : 'sos-emergency',
        renotify: true,
        requireInteraction: data.type !== 'reminder',
        silent: false,
        data: {
            appUrl: appUrl,
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

// CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action;

    let urlToOpen;

    if (action === 'zap' && data.phone) {
        // ZAP ACTION -> WhatsApp (External)
        let phone = data.phone;
        if (!phone.startsWith('55')) {
            phone = '55' + phone;
        }

        let zapUrl = `https://wa.me/${phone}`;
        if (data.whatsappMessage) {
            const encodedMsg = encodeURIComponent(data.whatsappMessage);
            zapUrl += `?text=${encodedMsg}`;
        }
        urlToOpen = zapUrl;
    } else {
        // BODY CLICK -> App Dashboard (Internal)
        // Solves "não tem como voltar" by keeping user in the app flow
        urlToOpen = data.appUrl || 'https://sigremedios.vercel.app/';
    }

    console.log('[SW v19] Action:', action, '-> Opening:', urlToOpen);

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
