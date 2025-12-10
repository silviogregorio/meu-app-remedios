import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const VersionCheck = () => {
    const location = useLocation();

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Add timestamp to prevent caching of the version file itself
                const response = await fetch('/version.json?t=' + new Date().getTime());
                if (!response.ok) return;

                const data = await response.json();
                const serverVersion = data.version;
                // Use the injected build version constant
                // eslint-disable-next-line no-undef
                const currentVersion = __APP_VERSION__;

                console.log(`Checking version... Server: ${serverVersion} | Local (Running): ${currentVersion}`);

                if (serverVersion && serverVersion !== currentVersion) {
                    console.log(`New version found: ${serverVersion}. Force updating...`);

                    // 1. Clear caches
                    if ('caches' in window) {
                        try {
                            const keys = await caches.keys();
                            await Promise.all(keys.map(key => caches.delete(key)));
                            console.log('Caches cleared.');
                        } catch (e) {
                            console.error('Error clearing caches:', e);
                        }
                    }

                    if ('serviceWorker' in navigator) {
                        try {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            for (const registration of registrations) {
                                await registration.unregister();
                            }
                            console.log('Service Workers unregistered.');
                        } catch (e) {
                            console.error('Error unregistering SW:', e);
                        }
                    }

                    // 3. Force Reload
                    window.location.reload(true);
                }
            } catch (error) {
                console.error('Version check failed:', error);
            }
        };

        checkVersion();
    }, [location]); // Re-check on route changes is aggressive but ensures we catch it.

    return null;
};

export default VersionCheck;
