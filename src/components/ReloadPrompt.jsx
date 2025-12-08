import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from './ui/Button';
import { RefreshCw } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-primary/20 animate-fade-in-up flex flex-col gap-3 max-w-sm">
            <div className="flex items-start gap-3">
                <RefreshCw className="text-primary animate-spin-slow shrink-0" size={24} />
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Atualização Disponível</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Uma nova versão do app está disponível. Clique para atualizar.
                    </p>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={close}>
                    Fechar
                </Button>
                <Button size="sm" onClick={() => updateServiceWorker(true)}>
                    Atualizar Agora
                </Button>
            </div>
        </div>
    );
}

export default ReloadPrompt;
