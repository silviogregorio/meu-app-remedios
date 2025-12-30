import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, Heart, X } from 'lucide-react';

/**
 * SOSPatientFeedback - Componente que mostra feedback visual e sonoro
 * para o PACIENTE quando um cuidador confirma estar a caminho.
 */
const SOSPatientFeedback = () => {
    const { user } = useAuth();
    const { speak } = useApp();
    const [feedback, setFeedback] = useState(null);
    const speakRef = useRef(speak);

    useEffect(() => {
        speakRef.current = speak;
    }, [speak]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('sos-patient-feedback')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sos_alerts',
                filter: `triggered_by=eq.${user.id}`
            }, (payload) => {
                const updated = payload.new;
                const old = payload.old;

                // Verificar se o status mudou para 'acknowledged'
                if (updated.status === 'acknowledged' && old?.status !== 'acknowledged') {
                    setFeedback({
                        alertId: updated.id,
                        caregiverName: 'Seu cuidador'
                    });

                    // Voz assertiva de confirmação
                    setTimeout(() => {
                        if (speakRef.current) {
                            speakRef.current('Boa notícia! Seu cuidador recebeu o alerta e está a caminho!');
                        }
                    }, 300);

                    // Auto-fechar após 15 segundos
                    setTimeout(() => {
                        setFeedback(null);
                    }, 15000);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);


    if (!feedback) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-emerald-500 animate-pulse-slow">

                {/* Header Verde */}
                <div className="p-8 text-center bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/20 p-5 rounded-full">
                            <CheckCircle2 className="w-16 h-16 animate-bounce" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black mb-2">
                        AJUDA A CAMINHO!
                    </h2>
                    <p className="text-emerald-100 font-medium text-lg">
                        Seu cuidador recebeu o alerta
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 text-center">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 mb-6">
                        <div className="flex justify-center mb-4">
                            <Heart className="w-12 h-12 text-emerald-500 animate-pulse" fill="currentColor" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-semibold text-lg">
                            Fique tranquilo! Alguém está vindo ajudá-lo.
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Mantenha a calma e aguarde no local.
                        </p>
                    </div>

                    <button
                        onClick={() => setFeedback(null)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-colors"
                    >
                        <X size={18} />
                        Entendi
                    </button>
                </div>

                {/* Footer sutil */}
                <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/10 text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Esta mensagem fechará automaticamente em alguns segundos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SOSPatientFeedback;
