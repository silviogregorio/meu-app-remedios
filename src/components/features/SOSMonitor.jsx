import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Bell, MapPin, Phone, CheckCircle2, X, UserCheck } from 'lucide-react';
import { SOSService } from '../../services/sosService';

const SOSMonitor = () => {
    const { user, patients, showToast, speak } = useApp();
    const [activeAlert, setActiveAlert] = useState(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    // Use ref to keep speak reference stable and avoid dependency issues
    const speakRef = useRef(speak);
    useEffect(() => {
        speakRef.current = speak;
    }, [speak]);

    // Use refs for patients to avoid re-subscribing when patient list updates locally
    const patientsRef = useRef(patients);
    useEffect(() => {
        patientsRef.current = patients;
    }, [patients]);

    // Track active alert in ref for the effect but use state for UI
    const activeAlertRef = useRef(null);
    useEffect(() => {
        activeAlertRef.current = activeAlert;
    }, [activeAlert]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('sos-realtime-global')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'sos_alerts'
            }, (payload) => {
                const newAlert = payload.new;

                const patient = patientsRef.current.find(p => p.id === newAlert.patient_id);
                const patientName = patient ? patient.name : 'Paciente';

                setActiveAlert({ ...newAlert, patientName: patientName });
                setIsAcknowledged(false);

                if (speakRef.current) {
                    setTimeout(() => {
                        speakRef.current(`ALERTA DE EMERGÊNCIA! ${patientName} disparou um sinal de SOS.`);
                    }, 200);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sos_alerts'
            }, (payload) => {
                const updated = payload.new;
                const currentAlert = activeAlertRef.current;

                if (currentAlert && updated.id === currentAlert.id && updated.status !== 'active') {
                    setActiveAlert(null);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);


    const handleAcknowledge = async () => {
        if (!activeAlert) return;

        try {
            // Update DB
            await SOSService.acknowledgeAlert(activeAlert.id, user.id);

            // Update local state to show "caminho"
            setIsAcknowledged(true);

            showToast(`Confirmado! O paciente será avisado que você está a caminho.`);

        } catch (error) {
            console.error('Erro ao confirmar SOS:', error);
            showToast('Erro ao confirmar SOS no servidor', 'error');
        }
    };

    const handleClose = () => {
        setActiveAlert(null);
    };

    if (!activeAlert) return null;

    const isHelp = activeAlert.alert_type === 'help_request';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border-4 ${isHelp ? 'border-amber-500' : 'border-red-600'} ${isHelp ? 'animate-help-pulse' : 'animate-red-pulse'}`}>

                <div className={`p-6 text-center ${isHelp ? 'bg-amber-500' : 'bg-red-600'} text-white`}>
                    <div className="flex justify-center mb-3">
                        <div className="bg-white/20 p-4 rounded-full">
                            <Bell className="w-12 h-12 animate-bounce" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black mb-1">
                        {isHelp ? 'PEDIDO DE AJUDA' : 'EMERGÊNCIA SOS'}
                    </h2>
                    <p className="text-white/90 font-medium">
                        {activeAlert.patientName} precisa de você!
                    </p>
                </div>

                <div className="p-8">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-slate-500">
                                <MapPin size={24} className={isHelp ? 'text-amber-500' : 'text-red-500'} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Localização</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {activeAlert.address || 'Localização enviada via GPS'}
                                </p>
                            </div>
                        </div>

                        {activeAlert.location_lat && (
                            <a
                                href={`https://www.google.com/maps?q=${activeAlert.location_lat},${activeAlert.location_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 py-2 px-4 rounded-xl transition-colors"
                            >
                                <MapPin size={16} /> Ver no Google Maps
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleAcknowledge}
                            disabled={isAcknowledged}
                            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${isAcknowledged
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                        >
                            <CheckCircle2 size={32} />
                            <span className="font-bold">{isAcknowledged ? 'Visualizado' : 'Tô a caminho'}</span>
                        </button>

                        <button
                            onClick={() => window.open(`tel:${activeAlert.patientPhone || '#'}`)}
                            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
                        >
                            <Phone size={32} className="text-blue-500" />
                            <span className="font-bold">Ligar agora</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1"
                    >
                        <X size={18} /> Ignorar
                    </button>
                    <span className="text-slate-400 text-xs font-medium">Disparado agora mesmo</span>
                </div>

            </div>
        </div>
    );
};

export default SOSMonitor;
