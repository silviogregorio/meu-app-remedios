import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatTime, getISODate, parseISODate } from '../utils/dateFormatter';
import { Check, Clock, Pill, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PillIcon from '../components/ui/PillIcon';

const Widget = () => {
    const navigate = useNavigate();
    const { user, prescriptions, medications, patients, consumptionLog, logConsumption } = useApp();
    const [nextDose, setNextDose] = useState(null);
    const [loading, setLoading] = useState(false);

    // Calcular próximo medicamento
    useEffect(() => {
        const calculateNext = () => {
            const now = new Date();
            const today = getISODate();
            const currentTime = formatTime(now);

            let dailyItems = [];

            prescriptions.forEach(presc => {
                const start = parseISODate(presc.startDate);
                const end = presc.endDate ? parseISODate(presc.endDate) : null;
                const target = parseISODate(today);

                if (target < start) return;
                if (end && target > end) return;

                // Check frequency - treat undefined/null as 'daily' (default)
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
                        const log = consumptionLog.find(l =>
                            (l.prescriptionId === presc.id || l.prescription_id === presc.id) &&
                            (l.scheduledTime === time || l.scheduled_time === time) &&
                            (l.date === today || (l.taken_at && l.taken_at.startsWith(today)))
                        );

                        const med = medications.find(m => m.id === presc.medicationId);
                        const patient = patients.find(p => p.id === presc.patientId);

                        if (med && patient) {
                            dailyItems.push({
                                id: `${presc.id}-${time}`,
                                prescriptionId: presc.id,
                                medicationId: med.id,
                                patientId: patient.id,
                                time: time,
                                medicationName: med.name,
                                medicationType: med.unit || 'unidade',
                                doseAmount: presc.doseAmount || 1,
                                dosage: med.dosage,
                                patientName: patient.name,
                                isTaken: !!log,
                                consumptionId: log?.id,
                                shape: med.shape,
                                color: med.color
                            });
                        }
                    });
                }
            });

            // Próximo não tomado
            const next = dailyItems
                .filter(item => !item.isTaken && item.time >= currentTime)
                .sort((a, b) => a.time.localeCompare(b.time))[0];

            setNextDose(next || null);
        };

        calculateNext();
        const interval = setInterval(calculateNext, 60000); // Atualiza a cada minuto
        return () => clearInterval(interval);
    }, [prescriptions, consumptionLog, medications, patients]);

    const handleMarkAsTaken = async () => {
        if (!nextDose) return;

        setLoading(true);
        try {

            await logConsumption({
                medicationId: nextDose.medicationId,
                patientId: nextDose.patientId,
                doseAmount: nextDose.doseAmount,
                unit: nextDose.medicationType,
                scheduledTime: nextDose.time,
                date: getISODate(),
                status: 'taken'
            });
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!nextDose) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Check size={48} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                        Tudo em dia! 🎉
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Não há medicamentos pendentes no momento.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao App
                    </button>
                </div>
            </div>
        );
    }

    const [hours, minutes] = nextDose.time.split(':').map(Number);
    const doseDate = new Date();
    doseDate.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const diffMinutes = Math.round((doseDate - now) / 60000);

    let timeText;
    if (diffMinutes < 0) timeText = 'Agora';
    else if (diffMinutes < 60) timeText = `Em ${diffMinutes} min`;
    else {
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        timeText = `Em ${h}h${m > 0 ? ` ${m}min` : ''}`;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header compacto */}
                <div className="text-center mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="mx-auto mb-4 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>
                    <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Próxima Dose
                    </h1>
                </div>

                {/* Card principal */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Badge de tempo */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-white/90 text-sm font-medium mb-1">
                            <Clock size={16} />
                            {timeText}
                        </div>
                        <div className="text-4xl font-black text-white tracking-tight">
                            {nextDose.time}
                        </div>
                    </div>

                    {/* Medicamento */}
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <PillIcon
                                    shape={nextDose.shape}
                                    color={nextDose.color}
                                    size={40}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
                                    {nextDose.medicationName}
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    {nextDose.doseAmount} {nextDose.medicationType}
                                </p>
                                {nextDose.dosage && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {nextDose.dosage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Paciente */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-6 flex items-center gap-2">
                            <User size={18} className="text-slate-500 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {nextDose.patientName}
                            </span>
                        </div>

                        {/* Botão de ação */}
                        <button
                            onClick={handleMarkAsTaken}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <span>Marcando...</span>
                            ) : (
                                <>
                                    <Check size={24} />
                                    Marcar como Tomado
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer info */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                    Atualizado automaticamente a cada minuto
                </p>
            </div>
        </div>
    );
};

export default Widget;
