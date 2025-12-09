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
                const localVersion = localStorage.getItem('app_version');

                console.log(`Checking version... Server: ${serverVersion} | Local: ${localVersion}`);

                if (serverVersion && serverVersion !== localVersion) {
                    console.log(`New version found: ${serverVersion}. Force updating...`);

                    // 1. Clear Local Storage version to prevent loops if reload fails, 
                    // BUT here we want to set it so next load matches. 
                    // Actually, we should only set it AFTER the reload effectively happens, 
                    // but we can't run code after reload. 
                    // So we update it now. If the reload serves old code again, it will loop?
                    // No, because old code (if *truly* old) won't have this VersionCheck component!
                    // If old code DOES have VersionCheck but is just one version behind,
                    // valid point.
                    // The "Stuck" version (v1.3.1) definitely does NOT have this component.
                    // So once this component loads, it means we ARE on the new version.
                    // So we should just align the localStorage.

                    localStorage.setItem('app_version', serverVersion);

                    // 2. Clear all caches (Service Workers, Cache API)
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
                } else if (!localVersion) {
                    // First run with this system
                    localStorage.setItem('app_version', serverVersion);
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
