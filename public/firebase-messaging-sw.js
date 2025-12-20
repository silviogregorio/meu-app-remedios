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

console.log('[SW] 🚀 Service Worker v16 - FCM Native Sound');

const broadcastChannel = new BroadcastChannel('fcm-push-channel');

// Handle background messages - FCM with notification payload handles display
// We just need to handle the click action
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);
    broadcastChannel.postMessage({ type: 'FCM_PUSH', ...payload.data });

    // FCM with notification payload already shows the notification
    // We don't need to show another one (would cause duplicate)
    // The click action is handled by notificationclick event
});

// CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    // Get data from notification or FCM data
    const data = event.notification.data || {};
    const fcmData = data.FCM_MSG?.data || data;

    const mapUrl = fcmData.mapUrl || data.mapUrl || 'https://sigremedios.vercel.app';
    const phone = fcmData.phone || data.phone || '';
    const action = event.action;

    let urlToOpen;

    if (action === 'zap' && phone) {
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }
        urlToOpen = `https://wa.me/${formattedPhone}`;
    } else {
        urlToOpen = mapUrl;
    }

    console.log('[SW] Opening URL:', urlToOpen);

    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
