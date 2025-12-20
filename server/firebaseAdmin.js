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
 * Send push notification with:
 * - Top-level 'notification' for RELIABLE background delivery
 * - webpush.fcm_options.link for click action (opens Google Maps)
 * - data field for foreground handling
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!isInitialized) await initFirebaseAdmin();
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] No tokens provided');
        return;
    }

    console.log(`📱 [FCM] Sending to ${tokens.length} token(s)...`);

    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';

    const message = {
        // TOP-LEVEL NOTIFICATION - Required for background delivery on web
        // FCM will display this automatically when app is in background
        notification: {
            title: title,
            body: body,
            imageUrl: 'https://sigremedios.vercel.app/logo192.png'
        },

        // DATA - For foreground handling in Layout.jsx
        data: {
            title: String(title),
            body: String(body),
            type: String(data.type || 'sos'),
            alertId: String(data.alertId || ''),
            mapUrl: String(mapUrl),
            timestamp: Date.now().toString()
        },

        // WEB PUSH - Click action via fcm_options.link
        webpush: {
            headers: {
                Urgency: 'high',
                TTL: '86400'
            },
            // This is the URL that opens when user clicks the notification
            fcm_options: {
                link: mapUrl
            }
        },

        // ANDROID
        android: {
            priority: 'high',
            notification: {
                clickAction: mapUrl,
                sound: 'default'
            }
        },

        tokens: tokens
    };

    try {
        console.log('📱 [FCM] Sending with notification + fcm_options.link:', mapUrl);
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
