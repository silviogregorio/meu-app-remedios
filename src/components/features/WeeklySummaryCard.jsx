import React, { useMemo } from 'react';
import { Share2, ArrowRight, Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateWeeklyStats } from '../../services/summaryService';
import { generateWeeklySummaryMessage } from '../../utils/whatsappUtils';
import Button from '../ui/Button';

const WeeklySummaryCard = () => {
    const {
        patients, prescriptions, consumptionLog, healthLogs,
        userPreferences, accessibility, showToast
    } = useApp();

    // Determine if today is the summary day
    const isSummaryDay = useMemo(() => {
        if (!userPreferences?.summary_day || userPreferences.summary_day === 'off') {
            return false;
        }

        const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
        return today.toString() === userPreferences.summary_day;
    }, [userPreferences?.summary_day]);

    // Calculate stats only once per render if it is summary day
    const stats = useMemo(() => {
        if (!isSummaryDay) return null;
        return calculateWeeklyStats(patients, prescriptions, consumptionLog, healthLogs);
    }, [isSummaryDay, patients, prescriptions, consumptionLog, healthLogs]);

    if (!isSummaryDay || !stats) return null;

    // Get overall adherence for the display
    const patientIds = Object.keys(stats);
    if (patientIds.length === 0) return null;

    const mainPatientId = patientIds[0];
    const mainStats = stats[mainPatientId];

    const handleShare = () => {
        try {
            const message = generateWeeklySummaryMessage(stats);
            const encodedMessage = encodeURIComponent(message);
            // Using api.whatsapp.com for broad compatibility and longer messages
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
            showToast('Abrindo WhatsApp...', 'success');
        } catch (error) {
            console.error('Error sharing weekly summary:', error);
            showToast('Erro ao compartilhar resumo.', 'error');
        }
    };

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 text-slate-800 shadow-xl shadow-indigo-100/50 dark:bg-slate-900 dark:border-slate-800 dark:text-white mb-6 relative overflow-hidden group">
            {/* Soft Decoration */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl dark:bg-indigo-900/20"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-100 p-2 rounded-xl dark:bg-indigo-900/50">
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Resumo Semanal Disponível</span>
                </div>

                <div className="mb-6">
                    <h3 className="text-2xl font-black mb-2 leading-tight text-slate-900 dark:text-white">
                        Sua família teve uma ótima semana! 🌟
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed dark:text-slate-400">
                        Compilamos as estatísticas de saúde dos últimos 7 dias. Deseja compartilhar com algum familiar ou médico?
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {mainStats.adherenceRate !== null && (
                        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Adesão</span>
                            </div>
                            <div className="text-xl font-black text-emerald-900 dark:text-emerald-100">{mainStats.adherenceRate}%</div>
                        </div>
                    )}
                    {mainStats.avgPressure && (
                        <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={14} className="text-rose-600 dark:text-rose-400" />
                                <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">P. Média</span>
                            </div>
                            <div className="text-xl font-black text-rose-900 dark:text-rose-100">{mainStats.avgPressure}</div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleShare}
                    variant="primary"
                    fullWidth
                    className="py-4 font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                    style={{ fontSize: accessibility?.largeText ? '1.5rem' : '1.125rem' }}
                >
                    <Share2 size={24} />
                    Compartilhar Resumo
                    <ArrowRight size={20} className="ml-1 opacity-70" />
                </Button>
            </div>
        </div>
    );
};

export default WeeklySummaryCard;
