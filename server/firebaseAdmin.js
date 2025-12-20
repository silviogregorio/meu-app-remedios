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
        // O arquivo JSON deve estar na raiz do projeto
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

export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!isInitialized) await initFirebaseAdmin();
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] No tokens provided for push notification');
        return;
    }

    console.log(`📱 [FCM] Sending push to ${tokens.length} token(s)...`);
    console.log(`📱 [FCM] Token preview: ${tokens[0]?.substring(0, 30)}...`);

    // Standard high-priority notification message
    const message = {
        // Top-level notification for automatic browser handling if background
        notification: {
            title: title,
            body: body
        },
        // Data for application-level handling
        data: {
            title: title,
            body: body,
            ...Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            click_action: '/',
            timestamp: Date.now().toString()
        },
        webpush: {
            headers: {
                Urgency: 'high',
                TTL: '86400'
            },
            notification: {
                title: title,
                body: body,
                icon: '/logo192.png',
                badge: '/logo192.png',
                requireInteraction: true
            },
            fcm_options: {
                link: '/'
            }
        },
        tokens: tokens
    };

    try {
        console.log('📱 [FCM] Full message payload:', JSON.stringify(message, null, 2));
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ [FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code || 'unknown';
                    const errorMsg = resp.error?.message || 'No message';
                    console.error(`❌ [FCM] Token ${idx} failed:`, errorCode, '-', errorMsg);

                    // Log specific error types
                    if (errorCode === 'messaging/registration-token-not-registered') {
                        console.log(`🗑️ [FCM] Token is invalid/expired and should be removed from DB`);
                    } else if (errorCode === 'messaging/invalid-registration-token') {
                        console.log(`🗑️ [FCM] Token format is invalid`);
                    }
                }
            });
        }
        return response;
    } catch (error) {
        console.error('❌ [FCM] Critical error sending push:', error.code, error.message);
        throw error;
    }
};
