import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Hook para verificar atualizações do app automaticamente.
 * Compara a versão local com version.json no servidor.
 */
export const useAppUpdate = () => {
    const { showToast } = useApp();
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
    const checkIntervalRef = useRef(null);
    const hasShownToast = useRef(false);

    const checkForUpdates = async () => {
        try {
            // Busca version.json do servidor (sem cache)
            const response = await fetch('/version.json?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });

            if (!response.ok) return;

            const data = await response.json();
            const serverVersion = data.version;

            // Compara versões
            if (serverVersion && serverVersion !== currentVersion) {
                console.log(`🔄 Nova versão detectada: ${currentVersion} → ${serverVersion}`);
                setUpdateAvailable(true);

                if (!hasShownToast.current) {
                    hasShownToast.current = true;
                    showToast(`🚀 Nova versão disponível (v${serverVersion})! Atualizando em 5 segundos...`, 'warning', 10000);

                    // Auto-reload após 5 segundos
                    setTimeout(() => {
                        // Limpa caches antes de recarregar
                        if ('caches' in window) {
                            caches.keys().then(names => {
                                names.forEach(name => caches.delete(name));
                            });
                        }
                        window.location.reload();
                    }, 5000);
                }
            }
        } catch (err) {
            // Falha silenciosa - não incomoda o usuário com erros de rede
            console.log('Verificação de atualização falhou:', err.message);
        }
    };

    const forceUpdate = () => {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload();
    };

    useEffect(() => {
        // Função de teste para debugging (pode testar no console do navegador)
        window.__testAppUpdate = () => {
            hasShownToast.current = false;
            showToast(`🚀 Nova versão disponível (v9.9.9)! Atualizando em 5 segundos...`, 'warning', 10000);
            console.log('⏳ Teste: página recarregaria em 5 segundos...');
        };

        // Verificação inicial após 10 segundos
        const initialTimeout = setTimeout(() => {
            checkForUpdates();
        }, 10000);

        // Verifica a cada 5 minutos
        checkIntervalRef.current = setInterval(() => {
            checkForUpdates();
        }, 5 * 60 * 1000);

        return () => {
            clearTimeout(initialTimeout);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            delete window.__testAppUpdate;
        };
    }, []);

    return { updateAvailable, checkForUpdates, forceUpdate, currentVersion };
};

export default useAppUpdate;
