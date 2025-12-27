import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pill, Activity, Smartphone, Settings, LayoutGrid, Phone, FileHeart, AlertTriangle, Volume2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PillIcon from '../ui/PillIcon';
import ConfirmationModal from '../ui/ConfirmationModal';
import { getISODate, parseISODate } from '../../utils/dateFormatter';

const SimplifiedHome = () => {
    const {
        user,
        prescriptions,
        medications,
        patients,
        consumptionLog,
        logConsumption,
        updateUserPreferences,
        userPreferences
    } = useApp();
    const navigate = useNavigate();

    const [nextMedication, setNextMedication] = useState(null);
    const [timeText, setTimeText] = useState('');
    const [showSOSConfirm, setShowSOSConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [sosLoading, setSosLoading] = useState(false);

    // Text-to-Speech function
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
        }
    };

    // 1. Find Next Medication Logic (Simplified version of Home.jsx)
    useEffect(() => {
        const calculateNextMedication = () => {
            const now = new Date();
            const todayStr = getISODate();
            const currentTime = now.toTimeString().slice(0, 5);

            let candidates = [];

            prescriptions.forEach(presc => {
                // Check Active Status
                const start = parseISODate(presc.startDate);
                const end = presc.endDate ? parseISODate(presc.endDate) : null;
                const target = parseISODate(todayStr);

                if (target < start) return;
                if (end && target > end) return;

                // Check Frequency - treat undefined/null as 'daily' (default)
                let isDue = false;
                const freq = presc.frequency || 'daily';

                if (freq === 'daily') {
                    isDue = true;
                } else if (freq === 'specific_days') {
                    const weekMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
                    const dayStr = weekMap[target.getDay()];
                    if (presc.weekDays && presc.weekDays.includes(dayStr)) isDue = true;
                } else if (freq === 'interval') {
                    const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
                    if (presc.intervalDays && diffDays % presc.intervalDays === 0) isDue = true;
                } else {
                    // Unknown frequency type, treat as daily
                    isDue = true;
                }

                if (isDue) {
                    presc.times.forEach(time => {
                        // Check if already taken
                        const log = consumptionLog.find(l =>
                            (l.prescriptionId === presc.id || l.prescription_id === presc.id) &&
                            (l.scheduledTime === time || l.scheduled_time === time) &&
                            (l.date === todayStr || (l.taken_at && l.taken_at.startsWith(todayStr)))
                        );

                        if (!log && time >= currentTime) {
                            const med = medications.find(m => m.id === presc.medicationId);
                            const patient = patients.find(p => p.id === presc.patientId);
                            if (med) {
                                candidates.push({
                                    ...presc,
                                    prescriptionId: presc.id,
                                    time,
                                    medication: med,
                                    patientName: patient?.name || 'Você',
                                    doseAmount: presc.doseAmount || 1
                                });
                            }
                        }
                    });
                }
            });

            // Sort by time
            candidates.sort((a, b) => a.time.localeCompare(b.time));

            if (candidates.length > 0) {
                const next = candidates[0];

                // Count how many doses at the same time
                const sameTImeDoses = candidates.filter(c => c.time === next.time);

                setNextMedication({
                    ...next,
                    pendingCount: sameTImeDoses.length,
                    allPendingAtTime: sameTImeDoses
                });

                // Calculate nice time text
                const [h, m] = next.time.split(':').map(Number);
                const doseDate = new Date();
                doseDate.setHours(h, m, 0, 0);
                const diffMinutes = Math.round((doseDate - now) / 60000);

                if (diffMinutes <= 0) setTimeText('Agora');
                else if (diffMinutes < 60) setTimeText(`Em ${diffMinutes} min`);
                else {
                    const hh = Math.floor(diffMinutes / 60);
                    const mm = diffMinutes % 60;
                    setTimeText(`Daqui a ${hh}h ${mm > 0 ? `${mm}m` : ''}`);
                }

            } else {
                setNextMedication(null);
                setTimeText('Sem mais remédios hoje 🎉');
            }
        };

        calculateNextMedication();
        const interval = setInterval(calculateNextMedication, 60000); // Update every minute
        return () => clearInterval(interval);

    }, [prescriptions, consumptionLog, medications]);

    const handleTakeMedication = async () => {
        if (!nextMedication) return;

        const now = new Date();
        const todayStr = getISODate();

        await logConsumption({
            prescriptionId: nextMedication.prescriptionId,
            medicationId: nextMedication.medicationId,
            patientId: nextMedication.patientId,
            doseAmount: nextMedication.doseAmount,
            unit: nextMedication.medication.unit || 'unidade',
            scheduledTime: nextMedication.time,
            date: todayStr,
            status: 'taken'
        });

        // Optimistic UI update handled by useEffect re-run on consumptionLog change
    };

    const handleSOS = async () => {
        setSosLoading(true);
        try {
            // Find a patient ID (Active user linked patient or first one)
            // Ideally we should know WHICH patient is triggering SOS. 
            // In Simplified Mode, we assume the main user/elderly person is the focus.
            const targetPatient = patients.find(p => p.userId === user?.id) || patients[0];

            if (!targetPatient) {
                alert('Nenhum paciente configurado para SOS.');
                return;
            }

            // Using the existing API call logic from SOS component (simplified)
            const { data: { session } } = await import('../../lib/supabase').then(m => m.supabase.auth.getSession());
            await fetch(`${import.meta.env.VITE_API_URL || ''}/api/sos-alert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    patientId: targetPatient.id,
                    location: null, // Optional: could add geo logic if requested
                    type: 'emergency_button'
                })
            });
            alert('SOS Enviado! A ajuda foi notificada.');
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar SOS. Tente ligar 192.');
        } finally {
            setSosLoading(false);
            setShowSOSConfirm(false);
        }
    };

    const handleExitMode = () => {
        setShowExitConfirm(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 gap-4 animate-in fade-in duration-700">
            {/* Header / Date */}
            <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        {format(new Date(), "EEEE", { locale: ptBR }).split('-')[0]}
                    </h1>
                    <p className="text-xl text-slate-500 capitalize">
                        {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <button
                    onClick={handleExitMode}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-colors shadow-sm"
                >
                    <LayoutGrid size={20} />
                    <span>Sair do Modo Sênior</span>
                </button>
            </div>

            {/* Main Action Area - Compacted */}
            <div className="flex flex-col gap-4">

                {/* 1. NEXT MEDICATION (Giant Button) */}
                {nextMedication ? (
                    <div
                        className="w-full bg-blue-600 rounded-[2rem] p-6 shadow-xl shadow-blue-200 transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 min-h-[12rem]"
                    >
                        <div className="flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm shrink-0">
                                <PillIcon
                                    shape={nextMedication.medication.shape}
                                    color={nextMedication.medication.color}
                                    size={56}
                                    className="drop-shadow-lg"
                                />
                            </div>
                            <div className="text-left">
                                <p className="text-blue-100 text-lg font-medium mb-0.5">
                                    Tomar Agora ({nextMedication.time})
                                    {nextMedication.pendingCount > 1 && (
                                        <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-white text-sm">
                                            {nextMedication.pendingCount} doses
                                        </span>
                                    )}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-3xl font-black text-white leading-tight">
                                        {nextMedication.medication.name}
                                    </h2>
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            speak(`Remédio: ${nextMedication.medication.name}. Dose: ${nextMedication.doseAmount} ${nextMedication.medication.unit || 'unidade'}. ${nextMedication.instructions || ''}`);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                speak(`Remédio: ${nextMedication.medication.name}. Dose: ${nextMedication.doseAmount} ${nextMedication.medication.unit || 'unidade'}. ${nextMedication.instructions || ''}`);
                                            }
                                        }}
                                        className="p-4 bg-white/30 hover:bg-white/50 active:bg-white/60 rounded-full transition-colors cursor-pointer"
                                        title="Ouvir Instrução"
                                    >
                                        <Volume2 size={28} className="text-white" />
                                    </span>
                                </div>
                                <p className="text-blue-200 text-lg font-medium">
                                    {Number(nextMedication.doseAmount)} {nextMedication.medication.unit || 'unidade(s)'}
                                    {nextMedication.pendingCount > 1 && ` (confirme ${nextMedication.pendingCount}x)`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleTakeMedication}
                            className="px-6 py-3 bg-white text-blue-700 rounded-full font-bold text-lg uppercase tracking-wider shadow-sm shrink-0 hover:bg-blue-50 active:scale-95 transition-all"
                        >
                            Confirmar
                        </button>
                    </div>
                ) : (
                    <div className="w-full bg-emerald-500 rounded-[2rem] p-6 shadow-xl shadow-emerald-200 flex flex-wrap sm:flex-nowrap items-center justify-center gap-6 min-h-[12rem]">
                        <div className="bg-white/20 p-5 rounded-full shrink-0">
                            <Activity size={56} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-3xl font-black text-white">Tudo Certo!</h2>
                            <p className="text-emerald-100 text-lg leading-tight mt-1">Você tomou todos os remédios por enquanto.</p>
                        </div>
                    </div>
                )}

                {/* 2. Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* SOS Button */}
                    <button
                        onClick={() => setShowSOSConfirm(true)}
                        className="bg-red-500 rounded-3xl p-6 shadow-lg shadow-red-200 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 min-h-[10rem]"
                    >
                        <AlertTriangle size={48} className="text-white fill-red-500 stroke-2" />
                        <span className="text-white font-black text-2xl tracking-wide">SOS</span>
                    </button>

                    {/* Remote Assistance Button */}
                    <button
                        onClick={async () => {
                            const targetPatient = patients.find(p => p.userId === user?.id) || patients[0];
                            if (targetPatient) await requestHelp(targetPatient.id);
                        }}
                        className="bg-amber-400 rounded-3xl p-6 shadow-lg shadow-amber-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 min-h-[10rem]"
                    >
                        <HelpCircle size={48} className="text-slate-900" />
                        <span className="text-slate-900 font-black text-xl tracking-wide leading-tight">Dúvida / Ajuda</span>
                    </button>

                    {/* Health Card / Phone */}
                    <button
                        onClick={() => navigate('/share')}
                        className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 active:scale-95 transition-all flex flex-wrap items-center justify-center gap-4 col-span-2 min-h-[6rem]"
                    >
                        <FileHeart size={40} className="text-slate-800" />
                        <span className="text-slate-800 font-bold text-2xl">Meu Cartão SOS</span>
                    </button>
                </div>
            </div>

            {/* Quick Contacts Footer (Optional, good for elderly) */}
            <div className="grid grid-cols-2 gap-4">
                <a href="tel:192" className="bg-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <Phone size={24} className="text-slate-700" />
                    <span className="text-slate-900 font-bold text-lg">SAMU 192</span>
                </a>
                <div className="bg-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Cuidador (Responsável)</span>
                    <p className="text-slate-900 font-bold text-base leading-tight">
                        {user?.user_metadata?.full_name || 'Desconhecido'}
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {(() => {
                            const phone = user?.user_metadata?.phone || user?.phone;
                            if (!phone) return 'Sem Telefone';
                            const cleaned = phone.replace(/\D/g, '');
                            const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
                            if (match) {
                                return `(${match[1]}) ${match[2]}-${match[3]}`;
                            }
                            const matchLandline = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
                            if (matchLandline) {
                                return `(${matchLandline[1]}) ${matchLandline[2]}-${matchLandline[3]}`;
                            }
                            return phone;
                        })()}
                    </p>
                </div>
            </div>

            {/* Modal de Confirmação SOS */}
            <ConfirmationModal
                isOpen={showSOSConfirm}
                onClose={() => setShowSOSConfirm(false)}
                onConfirm={handleSOS}
                title="PEDIR AJUDA?"
                description="Isso vai enviar um alerta de emergência para seus contatos."
                confirmText={sosLoading ? "Enviando..." : "SIM, PEDIR AJUDA"}
                cancelText="Cancelar"
                variant="danger"
            />

            {/* Modal de Confirmação Sair */}
            <ConfirmationModal
                isOpen={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                onConfirm={() => updateUserPreferences({ simplified_mode: false })}
                title="Voltar ao Painel Completo?"
                description="Você voltará para a visualização com todas as funções, relatórios e dashboards do sistema. Deseja continuar?"
                confirmText="Sim, Ir para Painel"
                cancelText="Não, Ficar aqui"
                variant="primary"
            />
        </div>
    );
};

export default SimplifiedHome;
