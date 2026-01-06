import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Smartphone, Monitor, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const BiometricSetup = () => {
    const { enrollPasskey, user, hasManualPasskey } = useAuth();
    const { showToast } = useApp();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);

    // Fetch registered devices
    useEffect(() => {
        const fetchDevices = async () => {
            if (!user?.id) {
                setLoadingDevices(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('webauthn_credentials')
                    .select('id, friendly_name, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setDevices(data || []);
            } catch (err) {
                console.error('Erro ao buscar dispositivos:', err);
            } finally {
                setLoadingDevices(false);
            }
        };

        fetchDevices();
    }, [user?.id, success]); // Refetch after successful enrollment

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

    const handleRemoveDevice = async (deviceId, deviceName) => {
        if (!confirm(`Remover "${deviceName}"?\n\nVocê não poderá mais usar este dispositivo para login biométrico.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('webauthn_credentials')
                .delete()
                .eq('id', deviceId)
                .eq('user_id', user.id);

            if (error) throw error;

            setDevices(devices.filter(d => d.id !== deviceId));
            showToast('Dispositivo removido com sucesso', 'success');

            // If no devices left, clear local storage
            if (devices.length === 1) {
                localStorage.removeItem('sig_biometric_enabled');
            }
        } catch (err) {
            console.error('Erro ao remover dispositivo:', err);
            showToast('Erro ao remover dispositivo', 'error');
        }
    };

    const getDeviceIcon = (name) => {
        if (name.toLowerCase().includes('celular') || name.toLowerCase().includes('android') || name.toLowerCase().includes('iphone')) {
            return <Smartphone size={18} />;
        }
        return <Monitor size={18} />;
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

                    {/* Device List */}
                    {!loadingDevices && devices.length > 0 && (
                        <div className="mb-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                Dispositivos cadastrados ({devices.length})
                            </p>
                            {devices.map(device => (
                                <div
                                    key={device.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-slate-600 dark:text-slate-300">
                                            {getDeviceIcon(device.friendly_name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                {device.friendly_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Cadastrado em {new Date(device.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDevice(device.id, device.friendly_name)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remover dispositivo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasManualPasskey && !success && devices.length === 0 && (
                        <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg mb-4 text-sm border border-indigo-100 dark:border-indigo-800">
                            <ShieldCheck size={18} />
                            Biometria registrada no servidor
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
                                    showToast('Status local limpo. Se o erro persistir, use uma guia anônima.', 'info');
                                    setTimeout(() => window.location.reload(), 1500);
                                }}
                                className="px-4 py-2 text-slate-500 hover:text-red-500 text-xs font-medium transition-colors"
                            >
                                Resetar Status Local
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
