import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isInitialized = false;

export const initFirebaseAdmin = async () => {
    if (isInitialized) return true;

    try {
        const serviceAccountPath = join(__dirname, '..', 'sig-remedios-firebase-adminsdk-fbsvc-ef0bcb0706.json');
        const serviceAccount = JSON.parse(
            await readFile(serviceAccountPath, 'utf8')
        );

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        isInitialized = true;
        console.log('✅ Firebase Admin SDK inicializado');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
        return false;
    }
};

/**
 * Send push notification with full support for:
 * - Background delivery (screen off)
 * - Sound
 * - Image
 * - Clickable link to Google Maps
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!isInitialized) await initFirebaseAdmin();
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] No tokens provided');
        return;
    }

    console.log(`📱 [FCM] Sending to ${tokens.length} token(s)...`);

    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';
    const imageUrl = 'https://sigremedios.vercel.app/logo192.png';

    // FCM v1 API - Proper structure for background notifications
    const message = {
        // TOP-LEVEL NOTIFICATION - Required for background delivery
        // FCM will handle display automatically when app is in background
        notification: {
            title: title,
            body: body,
            imageUrl: imageUrl
        },

        // DATA - For app-level handling when in foreground
        data: {
            title: String(title),
            body: String(body),
            type: String(data.type || 'sos'),
            alertId: String(data.alertId || ''),
            mapUrl: String(mapUrl),
            click_action: mapUrl,
            timestamp: Date.now().toString()
        },

        // ANDROID-SPECIFIC CONFIG
        android: {
            priority: 'high',
            ttl: 86400000, // 24 hours in ms
            notification: {
                title: title,
                body: body,
                icon: 'ic_notification',
                color: '#dc2626',
                sound: 'default',
                channelId: 'sos_alerts',
                priority: 'max',
                visibility: 'public',
                defaultSound: true,
                defaultVibrateTimings: true,
                clickAction: mapUrl,
                imageUrl: imageUrl
            }
        },

        // WEB PUSH CONFIG (Chrome, Firefox, Edge)
        webpush: {
            headers: {
                Urgency: 'high',
                TTL: '86400'
            },
            notification: {
                title: title,
                body: body,
                icon: imageUrl,
                badge: imageUrl,
                image: imageUrl,
                tag: 'sos-' + Date.now(),
                renotify: true,
                requireInteraction: true,
                silent: false,
                vibrate: [300, 100, 300, 100, 300],
                data: {
                    mapUrl: mapUrl,
                    type: 'sos'
                }
            },
            fcm_options: {
                link: mapUrl
            }
        },

        // APPLE iOS CONFIG
        apns: {
            headers: {
                'apns-priority': '10',
                'apns-push-type': 'alert'
            },
            payload: {
                aps: {
                    alert: {
                        title: title,
                        body: body
                    },
                    sound: 'default',
                    badge: 1,
                    'mutable-content': 1,
                    'content-available': 1
                },
                mapUrl: mapUrl
            },
            fcm_options: {
                image: imageUrl
            }
        },

        tokens: tokens
    };

    try {
        console.log('📱 [FCM] Map URL:', mapUrl);
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ [FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`❌ [FCM] Token ${idx}:`, resp.error?.code, '-', resp.error?.message);
                }
            });
        }
        return response;
    } catch (error) {
        console.error('❌ [FCM] Error:', error.code, error.message);
        throw error;
    }
};
