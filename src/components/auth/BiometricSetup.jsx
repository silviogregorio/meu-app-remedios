import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const BiometricSetup = () => {
    const { enrollPasskey, user, hasManualPasskey } = useAuth();
    const { showToast } = useApp();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleEnroll = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Detect device type roughly for friendly name
            const deviceName = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                ? 'Celular'
                : 'Computador';

            const { error: enrollError } = await enrollPasskey(`${deviceName} de ${user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}`);

            if (enrollError) {
                // Handle common WebAuthn errors nicely
                if (enrollError.message.includes('cancelled') || enrollError.name === 'NotAllowedError') {
                    throw new Error('O cadastro foi cancelado ou não autorizado.');
                } else if (enrollError.message.includes('not supported')) {
                    throw new Error('Seu dispositivo não suporta biometria (WebAuthn).');
                } else {
                    throw enrollError;
                }
            }

            setSuccess(true);
            showToast('Biometria cadastrada com sucesso!', 'success');

            // Generate haptic feedback if available
            if (navigator.vibrate) navigator.vibrate([10, 50, 10]);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao cadastrar biometria.');
            showToast('Falha no cadastro da biometria.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${success ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                    {success ? <CheckCircle2 size={24} /> : <Fingerprint size={24} />}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                        Biometria / Passkeys
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Use sua digital, FaceID ou Windows Hello para entrar de forma rápida e muito mais segura.
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {hasManualPasskey && !success && (
                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg mb-4">
                            <CheckCircle2 size={18} />
                            Biometria Ativada neste navegador
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleEnroll}
                            disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Aguardando...</span>
                                </>
                            ) : (
                                <>
                                    <Fingerprint size={18} />
                                    <span>{hasManualPasskey ? 'Adicionar Novo Dispositivo' : 'Cadastrar Biometria'}</span>
                                </>
                            )}
                        </button>

                        {hasManualPasskey && (
                            <button
                                onClick={() => {
                                    localStorage.removeItem('sig_biometric_enabled');
                                    showToast('Status limpo. Se necessário, recadastre.', 'info');
                                    window.location.reload();
                                }}
                                className="px-4 py-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors"
                            >
                                Limpar e Recadastrar
                            </button>
                        )}
                    </div>

                    <p className="mt-4 text-[11px] text-slate-400 italic">
                        * Se você trocou de aparelho ou atualizou o app, clique em "Adicionar Novo Dispositivo" para garantir a compatibilidade.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BiometricSetup;
