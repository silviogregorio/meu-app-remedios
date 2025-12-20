import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// PREENCHA ESTAS CHAVES COM OS DADOS DO SEU PROJETO FIREBASE (Configurações do Projeto > Geral)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "SUA_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sig-remedios.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sig-remedios",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sig-remedios.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "723963576474",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);

// Validar se as chaves foram preenchidas (não são os placeholders padrão)
export const isFirebaseConfigured =
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "SUA_API_KEY" &&
    firebaseConfig.appId &&
    firebaseConfig.appId !== "SEU_APP_ID";

const messaging = (typeof window !== 'undefined' && isFirebaseConfigured) ? getMessaging(app) : null;

export const requestForToken = async () => {
    if (!isFirebaseConfigured) {
        console.log('ℹ️ Push: Notificações desativadas (Aguardando configuração de chaves Firebase no .env)');
        return null;
    }
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);

        if (permission === 'granted') {
            // IMPORTANT: Register Service Worker explicitly for FCM
            let swRegistration = null;

            if ('serviceWorker' in navigator) {
                try {
                    console.log('🔄 Verificando Service Worker...');
                    // Register with version to bypass cache
                    swRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?v=${Date.now()}`, {
                        scope: '/'
                    });
                    console.log('✅ Service Worker registrado:', swRegistration.scope);

                    // Force an update check
                    await swRegistration.update();

                    // Wait for the service worker to be ready
                    await navigator.serviceWorker.ready;
                    console.log('✅ Service Worker pronto e atualizado');
                } catch (swError) {
                    console.warn('⚠️ Erro ao registrar Service Worker:', swError);
                    // Continue anyway - getToken will use default SW
                }
            }

            const tokenOptions = {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BL5xOWUNayV3ZDWAce-UUi-ln_-fC-dJOQt-9OCPn4AxrR31XGpg45vv4GxlACo6_vRBRT3ea8Q6dlYSe-Jn9p8'
            };

            // Use the registered SW if available
            if (swRegistration) {
                tokenOptions.serviceWorkerRegistration = swRegistration;

                // CRITICAL: Create native push subscription first
                try {
                    const existingSub = await swRegistration.pushManager.getSubscription();
                    if (existingSub) {
                        console.log('✅ Push subscription já existe');
                    } else {
                        const pushSubscription = await swRegistration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: tokenOptions.vapidKey
                        });
                        console.log('✅ Push subscription criada:', pushSubscription.endpoint.substring(0, 50) + '...');
                    }
                } catch (subError) {
                    console.warn('⚠️ Erro ao criar push subscription:', subError);
                }
            }

            const token = await getToken(messaging, tokenOptions);
            if (token) {
                console.log('✅ FCM Token obtido (primeiros 30 chars):', token.substring(0, 30) + '...');
                console.log('📋 Token completo para debug:', token);
                return token;
            } else {
                console.warn('⚠️ Nenhum token FCM retornado');
            }
        } else {
            console.warn('⚠️ Permissão de notificação negada:', permission);
        }
    } catch (error) {
        console.error('❌ Erro ao obter token FCM:', error);
    }
    return null;
};

// Legacy promise-based listener (resolves only once - kept for compatibility)
export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

// NEW: Callback-based listener that continuously listens for foreground messages
export const setupOnMessageListener = (callback) => {
    if (!messaging) {
        console.log('ℹ️ FCM messaging not available');
        return () => { }; // Return no-op unsubscribe
    }

    // onMessage returns an unsubscribe function
    const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📩 FCM foreground message received:', payload);
        callback(payload);
    });

    return unsubscribe;
};

export default app;
