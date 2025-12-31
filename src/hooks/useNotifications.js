import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return 'denied';
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }, []);

    const sendNotification = useCallback((title, options = {}) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    ...options
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }
    }, []);

    return {
        permission,
        requestPermission,
        sendNotification,
        isSupported: 'Notification' in window
    };
};
