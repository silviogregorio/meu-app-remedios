import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, AlertCircle, Calendar, User, Pill, X, Bell, Calendar as CalendarIcon, DownloadCloud, CircleHelp, Trophy, Zap, Flame, Activity, Star, ShieldCheck, ThumbsUp, Medal, Sparkles, Stethoscope, ChevronRight, Accessibility } from 'lucide-react';
import { formatDate, formatTime, formatDateFull, getISODate, parseISODate } from '../utils/dateFormatter';
import clsx from 'clsx';
import { useNotifications } from '../hooks/useNotifications';
import confetti from 'canvas-confetti';
import { generateICS, generateFutureSchedule } from '../utils/icsGenerator';
import { calculateStreak } from '../utils/gamification';
import VoiceCommand from '../components/features/VoiceCommand';
import OnboardingTour from '../components/OnboardingTour';
import MotivationCard from '../components/features/MotivationCard';
import PillIcon from '../components/ui/PillIcon';
import SponsorDisplay from '../components/features/SponsorDisplay';
import LocalOffersCarousel from '../components/features/LocalOffersCarousel';
import { fetchActiveWeightedOffers } from '../services/offerService';
import { OfferCard } from '../components/features/OfferCard';
import { MedicationCardShimmer, HeroCardShimmer, StatsCardShimmer, OfferCarouselShimmer } from '../components/ui/Shimmer';
import SimplifiedHome from '../components/features/SimplifiedHome';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import WeeklySummaryCard from '../components/features/WeeklySummaryCard';
import FamilyDashboard from '../components/features/FamilyDashboard';
import HealthTips from '../components/features/HealthTips';
import LowStockAlert from '../components/features/LowStockAlert';
import HealthTrendsCard from '../components/features/HealthTrendsCard';



const ITEMS_PER_PAGE = 6;

const Home = () => {
    const navigate = useNavigate();
    const { user, prescriptions, medications, patients, consumptionLog, logConsumption, removeConsumption, pendingShares, calculateStockDays, healthLogs, appointments, updateUserPreferences, userPreferences } = useApp();

    const { permission, requestPermission } = useNotifications();
    const [todaysSchedule, setTodaysSchedule] = useState([]);
    const [offersError, setOffersError] = useState(null);
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(getISODate());
    const [selectedPatient, setSelectedPatient] = useState('all');
    const [selectedMedication, setSelectedMedication] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [startTour, setStartTour] = useState(false);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [showElderlyConfirm, setShowElderlyConfirm] = useState(false);

    // Derived state
    const hasActiveFilters = selectedPatient !== 'all' || selectedMedication !== 'all' || selectedStatus !== 'all' || selectedDate !== getISODate();

    // Handlers
    const clearFilters = () => {
        setSelectedDate(getISODate());
        setSelectedPatient('all');
        setSelectedMedication('all');
        setSelectedStatus('all');
    };

    const handleToggleStatus = async (item) => {
        try {
            if (item.isTaken) {
                // If it's taken, we remove the log (undo)
                // removeConsumption expects (prescriptionId, scheduledTime, date)
                await removeConsumption(item.prescriptionId, item.time, selectedDate);
                // refresh is handled by AppContext subscription
            } else {
                // Mark as taken
                await logConsumption({
                    prescriptionId: item.prescriptionId, // ADDED: Required for LogService
                    medicationId: item.medicationId,
                    patientId: item.patientId,
                    doseAmount: item.doseAmount,
                    unit: item.medicationType,
                    scheduledTime: item.time, // 'HH:mm'
                    date: selectedDate, // 'YYYY-MM-DD'
                    status: 'taken'
                });
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Erro ao atualizar status do medicamento.');
        }
    };


    // Side effects
    useEffect(() => {
        // Check for tour
        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');
        if (!hasSeenTour) {
            // Delay slightly to ensure load
            setTimeout(() => setStartTour(true), 1500);
        }
    }, []);

    useEffect(() => {
        // Filter logic to populate todaysSchedule
        const filterSchedule = () => {
            // 1. Generate base schedule for the selected date
            // We need a helper for this or assume existing logic.
            // Since generateFutureSchedule exists, maybe there is generateDailySchedule?
            // Or we construct it manually from prescriptions.

            // Let's use the same logic as generateFutureSchedule but for single date or reuse it.
            // Actually, for Home view we usually want granular control.

            let dailyItems = [];
            prescriptions.forEach(presc => {
                const start = parseISODate(presc.startDate);
                const end = presc.endDate ? parseISODate(presc.endDate) : null;
                const target = parseISODate(selectedDate);

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
                    // Add times
                    presc.times.forEach(time => {
                        // Check consumption - using robust camelCase and date field
                        const log = consumptionLog.find(l =>
                            (l.prescriptionId === presc.id || l.prescription_id === presc.id) &&
                            (l.scheduledTime === time || l.scheduled_time === time) &&
                            (l.date === selectedDate || (l.taken_at && l.taken_at.startsWith(selectedDate)))
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
                                takenByName: log?.takenByName || log?.taken_by_name,
                                shape: med.shape,
                                color: med.color
                            });
                        }
                    });
                }
            });

            // Apply Filters
            if (selectedPatient !== 'all') {
                dailyItems = dailyItems.filter(i => i.patientId === selectedPatient);
            }
            if (selectedMedication !== 'all') {
                dailyItems = dailyItems.filter(i => i.medicationId === selectedMedication);
            }
            if (selectedStatus !== 'all') {
                if (selectedStatus === 'taken') dailyItems = dailyItems.filter(i => i.isTaken);
                if (selectedStatus === 'pending') dailyItems = dailyItems.filter(i => !i.isTaken);
            }

            // Sort by time
            dailyItems.sort((a, b) => a.time.localeCompare(b.time));

            setTodaysSchedule(dailyItems);
        };

        filterSchedule();
    }, [selectedDate, selectedPatient, selectedMedication, selectedStatus, prescriptions, consumptionLog, medications, patients]);

    // Proxima Consulta
    const nextAppointment = appointments
        .filter(a => a.status === 'scheduled' && new Date(a.appointmentDate) >= new Date())
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

    // Disable loading once data is available (with minimum visible time)
    useEffect(() => {
        if (prescriptions.length >= 0 && medications.length >= 0) {
            // Keep shimmer visible for at least 1000ms (1s)
            setTimeout(() => {
                setIsInitialLoading(false);
            }, 1000);
        }
    }, [prescriptions, medications]);

    // Animate percentage bar
    useEffect(() => {
        const total = todaysSchedule.length;
        const taken = todaysSchedule.filter(i => i.isTaken).length;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 100;

        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [todaysSchedule]);
    // useEffect(() => { // Removed
    //     const loadOffers = async () => {
    //         try {
    //             setOffersLoading(true);
    //             setOffersError(null);
    //             const ibgeCode = user?.user_metadata?.ibge_code || null;
    //             const data = await fetchActiveWeightedOffers(ibgeCode);
    //             setOffers(data);
    //         } catch (err) {
    //             console.error('Erro ao buscar ofertas', err);
    //             setOffersError(err);
    //         } finally {
    //             setOffersLoading(false);
    //         }
    //     };
    //     loadOffers();
    // }, [user]); // Removed

    // ... (existing hooks)

    // Simplified Mode Check - userPreferences is now from top scope

    if (userPreferences?.simplified_mode) {
        return <SimplifiedHome />;
    }

    // Full Page Shimmer Loading State
    if (isInitialLoading) {
        return (
            <div className="flex flex-col gap-4 pb-12 animate-pulse">
                {/* Header Shimmer */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </div>
                            <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Weekly Summary Shimmer */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>

                {/* Hero + Stats Grid Shimmer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                        <HeroCardShimmer />
                    </div>
                    <div className="flex flex-col gap-3">
                        <StatsCardShimmer />
                        <div className="bg-white dark:bg-slate-800 rounded-2xl h-32 shimmer"></div>
                    </div>
                </div>

                {/* Offers Carousel Shimmer */}
                <OfferCarouselShimmer />

                {/* Schedule Section Shimmer */}
                <div className="space-y-4">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <MedicationCardShimmer />
                    <MedicationCardShimmer />
                    <MedicationCardShimmer />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-12">
            {/* ... Header ... */}
            {/* Premium Header Section */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-2">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-8 h-1 bg-primary rounded-full"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Painel de Saúde</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Olá, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'Visitante'}</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-1">
                            Vamos cuidar da sua saúde hoje?
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateUserPreferences({ simplified_mode: true })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-full transition-all text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 shimmer-premium"
                            title="Modo para Idosos"
                        >
                            <Accessibility size={16} className="animate-pulse" />
                            Modo Sênior
                        </button>
                        <button
                            onClick={() => setStartTour(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full transition-all text-sm font-semibold border border-slate-200 dark:border-slate-600 shadow-sm"
                            title="Ajuda e Tutorial"
                        >
                            <CircleHelp size={16} />
                            Dicas
                        </button>
                    </div>
                </div>
            </div>
            {/* {!offersLoading && offers.length > 0 && ( // Removed
                <section className="offers-section my-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Ofertas Patrocinadas</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {offers.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                </section>
            )} */}


            {/* Weekly Summary Card */}
            <WeeklySummaryCard />

            {/* Family Dashboard (Visão Geral de Todos) */}
            <FamilyDashboard
                patients={patients}
                todaysSchedule={todaysSchedule}
                visible={selectedPatient === 'all' && !hasActiveFilters}
            />

            {/* Motivation Card */}
            <MotivationCard />

            {/* Low Stock Alert - Premium Component with Quick Refill */}
            <LowStockAlert />

            {/* Health Trends Dashboard - INSIGHTS 📈 */}
            <HealthTrendsCard logs={healthLogs} className="mt-2" />


            {pendingShares && pendingShares.length > 0 && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Bell size={24} className="text-white animate-bounce" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Convite Pendente!</h3>
                                <p className="text-violet-100">
                                    Você tem {pendingShares.length} convite{pendingShares.length > 1 ? 's' : ''} de acesso aguardando aprovação.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => document.querySelector('button[title*="Notificações"]')?.click()}
                            className="px-4 py-2 bg-white text-violet-700 rounded-lg font-bold hover:bg-violet-50 transition-colors shadow-sm"
                        >
                            Ver Convites
                        </button>
                    </div>
                </div>
            )}

            {permission === 'default' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">Ativar Notificações</h3>
                            <p className="text-sm text-blue-700">Receba lembretes dos seus medicamentos.</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={requestPermission}>Ativar</Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {isInitialLoading ? (
                    <>
                        <div className="md:col-span-2">
                            <HeroCardShimmer />
                        </div>
                        <div className="flex flex-col gap-3">
                            <StatsCardShimmer />
                            <div className="bg-white dark:bg-slate-800 rounded-2xl h-32 animate-pulse"></div>
                        </div>
                    </>
                ) : (
                    <>
                        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-900/20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <CardContent className="p-4 relative z-10">
                                {(() => {
                                    const now = new Date();
                                    const currentTime = formatTime(now);

                                    // Primeiro, procura a próxima dose futura não tomada
                                    let nextDose = todaysSchedule.find(item =>
                                        !item.isTaken && item.time >= currentTime
                                    );

                                    // Se não há dose futura, mas há doses atrasadas, pega a primeira atrasada
                                    if (!nextDose) {
                                        nextDose = todaysSchedule.find(item => !item.isTaken);
                                    }

                                    if (nextDose) {
                                        const [hours, minutes] = nextDose.time.split(':').map(Number);
                                        const doseDate = new Date();
                                        doseDate.setHours(hours, minutes, 0, 0);
                                        const diffMinutes = Math.round((doseDate - now) / 60000);

                                        let timeText;
                                        if (diffMinutes < 0) timeText = 'Horário chegou!';
                                        else if (diffMinutes < 60) timeText = `Em ${diffMinutes} min`;
                                        else {
                                            const h = Math.floor(diffMinutes / 60);
                                            const m = diffMinutes % 60;
                                            timeText = `Em ${h}h ${m > 0 ? `${m}min` : ''}`;
                                        }

                                        return (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/30 text-blue-50 text-sm font-bold backdrop-blur-sm border border-blue-400/30">
                                                            <Clock size={14} />
                                                            Próxima Dose
                                                        </span>

                                                        {/* BIG Visual Identity for Accessibility */}
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shrink-0 shadow-lg">
                                                                <PillIcon
                                                                    shape={nextDose.medication?.shape || 'round'}
                                                                    color={nextDose.medication?.color || 'white'}
                                                                    size={48}
                                                                    className="drop-shadow-md"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="text-3xl sm:text-4xl font-black leading-tight break-words">{nextDose.medicationName}</h3>
                                                                <p className="text-blue-100 text-xl sm:text-2xl font-bold mt-1">
                                                                    {Number(nextDose.doseAmount)} {nextDose.medicationType} {nextDose.dosage}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right shrink-0">
                                                        <div className="text-3xl sm:text-4xl font-bold tracking-tight">{nextDose.time}</div>
                                                        <div className="text-blue-200 font-medium text-base sm:text-lg">{timeText}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2 text-base text-white bg-white/20 p-3.5 rounded-xl backdrop-blur-sm">
                                                    <User size={18} className="shrink-0 mt-0.5" />
                                                    <span>Paciente: <span className="font-black text-lg">{nextDose.patientName}</span></span>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const allTaken = todaysSchedule.length > 0 && todaysSchedule.every(i => i.isTaken);
                                        return (
                                            <div className="flex flex-col items-center justify-center py-2 text-center h-full">
                                                <div className="w-full animate-in fade-in slide-in-from-bottom duration-700">
                                                    <div
                                                        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl overflow-hidden shadow-xl transform transition-transform duration-300"
                                                        onClick={(e) => {
                                                            const target = e.currentTarget;
                                                            target.classList.add('animate-shake');
                                                            setTimeout(() => target.classList.remove('animate-shake'), 500);
                                                        }}
                                                    >
                                                        {/* Image Section - Expansive with Overlay */}
                                                        <div className="relative w-full h-64 sm:h-72 active:scale-95 transition-transform duration-200 cursor-pointer">
                                                            <img
                                                                src="/assets/images/peace_illustration.png"
                                                                alt="Tranquilidade"
                                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 via-transparent to-transparent"></div>

                                                            {/* Text Overlay */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                                                                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                                                                    {allTaken ? 'Parabéns, tudo tomado!' : 'Sem mais doses hoje'}
                                                                </h3>
                                                                <p className="text-blue-100 font-medium text-lg leading-relaxed drop-shadow-sm max-w-xs mx-auto">
                                                                    {allTaken ? 'Você completou seu dia.' : 'Curta seu dia com paz, tranquilidade e saúde.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Card id="tour-summary-card" className="bg-white border-slate-200 shadow-sm">
                                <CardContent className="px-4 pt-4 pb-5 flex flex-col gap-2 relative z-10">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                            <Zap className="text-amber-500 fill-amber-500" size={16} />
                                            Energia
                                        </h3>
                                        {(() => {
                                            const total = todaysSchedule.length;
                                            const taken = todaysSchedule.filter(i => i.isTaken).length;
                                            const percentage = total > 0 ? Math.round((taken / total) * 100) : 100;

                                            return (
                                                <span className="text-lg font-black text-slate-900">{percentage}%</span>
                                            );
                                        })()}
                                    </div>

                                    {(() => {
                                        const total = todaysSchedule.length;
                                        const taken = todaysSchedule.filter(i => i.isTaken).length;
                                        // Fix: If total is 0, percentage is 100% (Day Complete/Rest)
                                        const percentage = total > 0 ? Math.round((taken / total) * 100) : 100;
                                        const isComplete = percentage === 100;

                                        return (
                                            <div className="flex flex-col gap-2 mt-2">
                                                {/* Gamified Bar - Restored Animation */}
                                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-[3000ms] ease-out"
                                                        style={{ width: `${animatedPercentage}%` }}
                                                    />
                                                </div>

                                                {/* Restored Message Box with Better Padding */}
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3 mb-1">
                                                    <div className={`p-1.5 rounded-full flex-shrink-0 ${isComplete ? 'bg-amber-100 border border-amber-200' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {isComplete ? <Star size={18} color="#d97706" fill="#fbbf24" className="animate-bounce drop-shadow-sm" /> : <Activity size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-xs mb-0.5">
                                                            {isComplete ? (
                                                                total === 0 ? "Dia Livre! Aproveite." : "Objetivo Concluído!"
                                                            ) : "Continue assim!"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                            {isComplete
                                                                ? (total === 0 ? "Sua saúde está em dia." : "Você completou tudo.")
                                                                : `${percentage}% da meta diária.`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Card de Próxima Consulta */}
                            <Card className="bg-white border-slate-200 shadow-sm relative group">
                                <CardContent className="p-4 flex flex-col gap-2 relative z-10">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                            <Stethoscope className="text-emerald-500" size={16} />
                                            Consultas
                                        </h3>
                                        <button onClick={() => navigate('/appointments')} className="text-slate-400 hover:text-emerald-500 transition-colors">
                                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>

                                    {nextAppointment ? (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-lg font-black text-slate-900 leading-tight line-clamp-1">
                                                {nextAppointment.doctorName}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <Clock size={12} className="text-emerald-500" />
                                                {format(new Date(nextAppointment.appointmentDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                                                    {nextAppointment.specialty || 'Geral'}
                                                </div>
                                            </div>

                                            {nextAppointment.address && (
                                                <div className="flex gap-2 mt-2">
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextAppointment.address + (nextAppointment.locationName ? ' ' + nextAppointment.locationName : ''))}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors"
                                                        title="Google Maps"
                                                    >
                                                        <MapPinIcon size={12} />
                                                        Maps
                                                    </a>
                                                    <a
                                                        href={`https://waze.com/ul?q=${encodeURIComponent(nextAppointment.address)}&navigate=yes`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-lg bg-[#33ccff]/10 text-[#0582ad] border border-[#33ccff]/30 hover:bg-[#33ccff]/20 transition-colors"
                                                        title="Waze"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                                            <path d="M18.503 13.068a2.501 2.501 0 0 1-5.003 0c0-.14.01-.277.032-.41l-2.028-.671a2.501 2.501 0 0 1-5.006 0 2.5 2.5 0 0 1 1.708-2.37l1.411-3.692A7.135 7.135 0 0 1 12 5.068c3.94 0 7.135 3.194 7.135 7.135 0 .23-.01.458-.032.682l1.638.541a.5.5 0 0 1 .163.844l-2.401 1.831c.022-.249.034-.5.034-.755a8.136 8.136 0 0 0-8.135-8.135 8.136 8.136 0 0 0-8.136 8.135c0 1.25.28 2.433.784 3.492l-1.018 2.665a1 1 0 0 0 1.266 1.266l2.665-1.018a8.12 8.12 0 0 0 4.439 1.295c4.493 0 8.135-3.642 8.135-8.135 0-.173-.005-.345-.015-.516l2.13.705a1.5 1.5 0 0 0 .49-2.532l-3.361-2.563a3.502 3.502 0 0 0-2.39-4.862l-1.41-3.693a1 1 0 0 0-1.88 0l-1.411 3.693a3.502 3.502 0 0 0-2.39 4.862l-3.36 2.563a1.5 1.5 0 0 0 .489 2.532l2.13-.705c-.01.171-.015.343-.015.516 0 4.493 3.642 8.135 8.135 8.135.804 0 1.583-.116 2.316-.334l.684.26a1 1 0 0 0 1.266-1.266l-.26-.684c.677-.732 1.21-1.579 1.576-2.51l3.053 1.012a.5.5 0 0 0 .61-.643l-1.442-3.771a3.501 3.501 0 0 0 2.215-3.32z" />
                                                        </svg>
                                                        Waze
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-2 h-full">
                                            <p className="text-[10px] text-slate-400 text-center italic">
                                                Nenhuma consulta agendada
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-50 rounded-full blur-xl opacity-50 group-hover:scale-150 transition-transform font-bold"></div>
                            </Card>
                        </div>
                    </>
                )}
            </div>

            {/* Local Offers Carousel (Moved below critical health info) */}
            <div className="mt-2">
                <LocalOffersCarousel userIbge={user?.user_metadata?.ibge_code} />
            </div>

            <SponsorDisplay user={user} variant="banner" />

            {/* Health Tips Section */}
            <div className="mt-4 mb-8">
                <HealthTips />
            </div>

            {/* Late Doses Alert */}
            {
                (() => {
                    const now = new Date();
                    const currentTime = formatTime(now);
                    const lateDoses = todaysSchedule.filter(item =>
                        !item.isTaken && item.time < currentTime
                    );

                    if (lateDoses.length > 0) {
                        return (
                            <Card className="mb-6 overflow-hidden border-rose-200/40 shadow-sm bg-white/60 backdrop-blur-sm">
                                {/* Header mais espaçoso e com ícone de alerta */}
                                <div className="bg-gradient-to-r from-rose-50/50 to-amber-50/50 dark:from-slate-800 dark:to-slate-700 px-5 py-4 border-b border-rose-100/50 dark:border-slate-600 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/30">
                                            <AlertCircle size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-black text-rose-900 dark:text-white leading-tight">
                                            Doses Pendentes
                                        </h3>
                                    </div>
                                    <span className="shrink-0 bg-rose-100 dark:bg-slate-700 text-rose-700 dark:text-rose-300 text-[10px] font-black px-3 py-1.5 rounded-full ring-1 ring-rose-200 dark:ring-slate-600 uppercase tracking-wider">
                                        {lateDoses.length} {lateDoses.length > 1 ? 'Itens' : 'Item'}
                                    </span>
                                </div>

                                <div className="flex flex-col divide-y divide-rose-100/30">
                                    {lateDoses.map((dose, index) => {
                                        const today = new Date();
                                        const isoToday = today.toISOString().split('T')[0];
                                        const doseDate = dose.date || isoToday;
                                        const isToday = doseDate === isoToday;
                                        const dateLabel = isToday ? 'Hoje' : format(parseISO(doseDate), "dd/MM (EEE)", { locale: ptBR });
                                        const isEven = index % 2 === 0;

                                        return (
                                            <div
                                                key={dose.id}
                                                className={clsx(
                                                    "p-5 transition-all duration-300",
                                                    isEven ? "bg-white/40" : "bg-rose-50/10",
                                                    "hover:bg-rose-50/30"
                                                )}
                                            >
                                                <div className="flex flex-col gap-5">
                                                    {/* Linha Superior: Horário compacto + Paciente abaixo agora */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="bg-white px-3 py-1 rounded-lg border border-rose-100 shadow-sm flex items-center gap-2 shrink-0 self-start">
                                                            <span className="font-black text-rose-600 text-sm leading-none">{dose.time}</span>
                                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{dateLabel}</span>
                                                        </div>
                                                        <div className="min-w-0 w-full pl-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">Paciente</p>
                                                            <p className="font-black text-slate-700 dark:text-slate-300 text-base leading-tight truncate">
                                                                {dose.patientName || 'Não informado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Bloco Medicamento à esquerda */}
                                                    <div className="flex flex-col items-start w-full pl-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">Medicamento</p>
                                                        <h4 className="text-slate-900 dark:text-white font-black text-3xl leading-tight">
                                                            {dose.medicationName}
                                                        </h4>
                                                    </div>

                                                    {/* Botão Tomar Agora */}
                                                    {/* Botão Tomar Agora */}
                                                    <button
                                                        onClick={() => handleToggleStatus(dose)}
                                                        className="w-full sm:w-auto self-end text-lg bg-emerald-400 hover:bg-emerald-500 text-white px-8 py-4 sm:px-10 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-3 min-h-[56px] group"
                                                    >
                                                        <Check size={28} className="group-hover:scale-110 transition-transform" />
                                                        <span>Tomar Agora</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    }
                    return null;
                })()
            }

            {/* Filters Section */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filtros
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const future = generateFutureSchedule(prescriptions, medications, patients, 7);
                                    if (future.length === 0) {
                                        alert('Nenhum horário encontrado para os próximos 7 dias.');
                                        return;
                                    }
                                    generateICS(future);
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-colors border border-slate-200"
                            >
                                <DownloadCloud size={12} />
                                Exportar Agenda
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-slate-500 hover:text-primary flex items-center gap-1"
                                >
                                    <X size={14} />
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Date Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Calendar size={14} />
                                Data
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Patient Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <User size={14} />
                                Paciente
                            </label>
                            <select
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">Todos os pacientes</option>
                                {patients.map(patient => (
                                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Medication Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Pill size={14} />
                                Medicamento
                            </label>
                            <select
                                value={selectedMedication}
                                onChange={(e) => setSelectedMedication(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">Todos os medicamentos</option>
                                {medications.map(med => (
                                    <option key={med.id} value={med.id}>{med.name} {med.dosage}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Clock size={14} />
                                Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">Todos</option>
                                <option value="taken">Tomados</option>
                                <option value="pending">Pendentes</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule List */}
            <div id="tour-schedule-list">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    {selectedDate === getISODate() ? 'Próximos Horários' : 'Horários do Dia'}
                </h2>
                <div className="flex flex-col gap-3">
                    {(() => {
                        const totalPages = Math.ceil(todaysSchedule.length / ITEMS_PER_PAGE);
                        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                        const paginatedSchedule = todaysSchedule.slice(startIndex, startIndex + ITEMS_PER_PAGE);


                        return isInitialLoading ? (
                            // Show shimmer skeletons while loading
                            <>
                                <MedicationCardShimmer />
                                <MedicationCardShimmer />
                                <MedicationCardShimmer />
                            </>
                        ) : todaysSchedule.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-8 text-center">
                                    <p className="text-[#64748b]">
                                        {hasActiveFilters
                                            ? 'Nenhum medicamento encontrado com estes filtros.'
                                            : 'Nenhum medicamento agendado para esta data.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {paginatedSchedule.map(item => {
                                    const patient = patients.find(p => p.id === item.patientId);
                                    const isOwner = patient?.userId === user?.id;
                                    const canEdit = isOwner || patient?.sharedWith?.some(s =>
                                        s.email?.toLowerCase() === user?.email?.toLowerCase() && s.permission === 'edit'
                                    );

                                    // Check if dose is late (past current time and not taken)
                                    const now = new Date();
                                    const currentTime = now.toTimeString().slice(0, 5);
                                    const isLate = !item.isTaken && item.time < currentTime;

                                    return (
                                        <Card
                                            key={item.id}
                                            className={clsx(
                                                "transition-all border-l-4",
                                                item.isTaken
                                                    ? "opacity-60 bg-green-50/50 border-l-green-500"
                                                    : isLate
                                                        ? "bg-red-50/50 border-l-red-500"
                                                        : "bg-amber-50/50 border-l-amber-500"
                                            )}
                                        >
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex flex-col items-center gap-1 mr-2 px-2">
                                                        <span className={clsx(
                                                            "font-bold text-lg",
                                                            item.isTaken ? "text-green-600"
                                                                : isLate ? "text-red-600"
                                                                    : "text-amber-600"
                                                        )}>
                                                            {item.time}
                                                        </span>
                                                        <div className={clsx(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all",
                                                            item.isTaken
                                                                ? "bg-green-100 border-green-200"
                                                                : isLate
                                                                    ? "bg-red-100 border-red-200"
                                                                    : "bg-white border-slate-100"
                                                        )}>
                                                            <PillIcon shape={item.shape} color={item.color} size={28} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={clsx("font-black text-base sm:text-lg", item.isTaken ? "text-slate-500 line-through" : "text-[#0f172a]")}>
                                                            {Number(item.doseAmount)} {item.medicationType} {item.medicationName} {item.dosage}
                                                        </h3>
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.patientName}</p>
                                                        {/* Status Badge */}
                                                        <span className={clsx(
                                                            "text-sm font-bold px-3 py-1 rounded-full mt-1.5 inline-block",
                                                            item.isTaken
                                                                ? "bg-green-100 text-green-800"
                                                                : isLate
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                        )}>
                                                            {item.isTaken ? 'Tomado' : isLate ? 'Atrasado' : 'Pendente'}
                                                        </span>
                                                        {item.isTaken && item.takenByName && (
                                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                                <User size={12} />
                                                                Tomado por {item.takenByName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {canEdit ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(item)}
                                                        className={clsx(
                                                            "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
                                                            item.isTaken
                                                                ? "bg-green-500 text-white hover:bg-green-600"
                                                                : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600"
                                                        )}
                                                        title={item.isTaken ? "Marcar como não tomado" : "Marcar como tomado"}
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                ) : (
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 shrink-0 cursor-not-allowed"
                                                        title="Modo Leitura: Você não pode alterar este status"
                                                    >
                                                        <User size={16} />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Pagination */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        );
                    })()}
                </div>
            </div>
            {/* Voice Command Integration */}
            <VoiceCommand
                schedule={todaysSchedule}
                onToggle={handleToggleStatus}
                patients={patients}
                selectedPatientId={selectedPatient}
            />

            <div className="text-center pb-20 pt-4 text-[10px] text-slate-300">
                v{__APP_VERSION__}
            </div>
            {
                startTour && (
                    <OnboardingTour
                        onTourEnd={() => {
                            console.log('Home: Tour finished. Updating state.');
                            setStartTour(false);
                            localStorage.setItem('hasSeenTour_v1', 'true');
                        }}
                    />
                )
            }
            {/* Confirmation Modal for Elderly Mode */}
            <ConfirmationModal
                isOpen={showElderlyConfirm}
                onClose={() => setShowElderlyConfirm(false)}
                onConfirm={() => {
                    updateUserPreferences({ simplified_mode: true });
                    setShowElderlyConfirm(false);
                }}
                title="Ativar Modo Idoso?"
                description="A interface ficará simplificada com textos maiores e foco nos remédios do dia. Você pode voltar ao normal a qualquer momento."
                confirmText="Sim, Ativar"
                cancelText="Cancelar"
                variant="primary"
            />
        </div>
    );
};

export default Home;
