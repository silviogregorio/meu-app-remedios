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
 * Send push notification - DATA-ONLY message
 * This ensures Service Worker has FULL control over notification display and click handling
 * Top-level 'notification' field is REMOVED to prevent FCM auto-display which bypasses SW click handler
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!isInitialized) await initFirebaseAdmin();
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] No tokens provided');
        return;
    }

    console.log(`📱 [FCM] Sending to ${tokens.length} token(s)...`);

    const mapUrl = data.mapUrl || 'https://sigremedios.vercel.app';

    // DATA-ONLY message - Service Worker controls everything
    // NO top-level 'notification' - that would cause FCM to auto-display and bypass SW click handler
    const message = {
        data: {
            title: String(title),
            body: String(body),
            type: String(data.type || 'sos'),
            alertId: String(data.alertId || ''),
            mapUrl: String(mapUrl),
            image: 'https://sigremedios.vercel.app/logo192.png',
            timestamp: Date.now().toString()
        },

        // Web Push specific config
        webpush: {
            headers: {
                Urgency: 'high',
                TTL: '86400'
            },
            // fcm_options.link is the click action URL
            fcm_options: {
                link: mapUrl
            }
        },

        // Android config - data only, no notification
        android: {
            priority: 'high',
            ttl: 86400000
        },

        tokens: tokens
    };

    try {
        console.log('📱 [FCM] Sending DATA-ONLY message with mapUrl:', mapUrl);
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
