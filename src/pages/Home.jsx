import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, AlertCircle, Calendar, User, Pill, X, Bell, Calendar as CalendarIcon, DownloadCloud, CircleHelp, Trophy, Zap, Flame, Activity, Star, ShieldCheck, ThumbsUp, Medal, Sparkles, Stethoscope, ChevronRight, Armchair } from 'lucide-react';
import { formatDate, formatTime, formatDateFull } from '../utils/dateFormatter';
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
import { MedicationCardShimmer, HeroCardShimmer, StatsCardShimmer } from '../components/ui/Shimmer';
import SimplifiedHome from '../components/features/SimplifiedHome';
import ConfirmationModal from '../components/ui/ConfirmationModal';


const ITEMS_PER_PAGE = 6;

const Home = () => {
    const navigate = useNavigate();
    const { user, prescriptions, medications, patients, consumptionLog, logConsumption, removeConsumption, pendingShares, calculateStockDays, appointments, updateUserPreferences, userPreferences } = useApp();
    const { permission, requestPermission } = useNotifications();
    const [todaysSchedule, setTodaysSchedule] = useState([]);
    const [offersError, setOffersError] = useState(null);
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPatient, setSelectedPatient] = useState('all');
    const [selectedMedication, setSelectedMedication] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [startTour, setStartTour] = useState(false);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [showElderlyConfirm, setShowElderlyConfirm] = useState(false);

    // Derived state
    const hasActiveFilters = selectedPatient !== 'all' || selectedMedication !== 'all' || selectedStatus !== 'all' || selectedDate !== new Date().toISOString().split('T')[0];

    // Handlers
    const clearFilters = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedPatient('all');
        setSelectedMedication('all');
        setSelectedStatus('all');
    };

    const handleToggleStatus = async (item) => {
        try {
            if (item.isTaken) {
                // If it's taken, we remove the log (undo)
                // We need the log ID. item.consumptionId should be populated.
                if (item.consumptionId) {
                    await removeConsumption(item.consumptionId);
                    // refresh is handled by AppContext subscription
                }
            } else {
                // Mark as taken
                await logConsumption({
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

            // Re-implementing basic schedule generation for the view:
            let dailyItems = [];
            const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay(); // 0=Sun, 6=Sat
            // Fix timezone issue by using getUTCDay if needed, but local string split is safer for "YYYY-MM-DD".
            // Actually new Date('2023-01-01') in JS defaults to UTC if ISO, but '2023-01-01T00:00:00' is local.
            // Let's rely on string parsing for robustness or date-fns if available.
            // But for now, simple logic:

            const targetDate = new Date(selectedDate); // Local time midnight

            prescriptions.forEach(presc => {
                // Check active range
                const start = new Date(presc.startDate);
                const end = presc.endDate ? new Date(presc.endDate) : null;
                const target = new Date(selectedDate);
                target.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                if (end) end.setHours(0, 0, 0, 0);

                if (target < start) return;
                if (end && target > end) return;

                // Check frequency
                // 1. "daily" -> everyday
                // 2. "specific_days" -> check weekDays
                // 3. "interval" -> check days interval

                let isDue = false;
                if (presc.frequency === 'daily') isDue = true;
                else if (presc.frequency === 'specific_days') {
                    const weekMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
                    const dayStr = weekMap[target.getDay()];
                    if (presc.weekDays && presc.weekDays.includes(dayStr)) isDue = true;
                } else if (presc.frequency === 'interval') {
                    const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
                    if (diffDays % presc.intervalDays === 0) isDue = true;
                }

                if (isDue) {
                    // Add times
                    presc.times.forEach(time => {
                        // Check consumption
                        const log = consumptionLog.find(l =>
                            l.prescription_id === presc.id &&
                            l.scheduled_time === time &&
                            l.taken_at.startsWith(selectedDate)
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
                                doseAmount: presc.dosageAmount || 1, // Fallback
                                dosage: med.dosage, // String like "500mg"
                                patientName: patient.name,
                                isTaken: !!log,
                                consumptionId: log?.id,
                                takenByName: log?.taken_by_name,
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
            // Keep shimmer visible for at least 1500ms (1.5s)
            setTimeout(() => {
                setIsInitialLoading(false);
            }, 1500);
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

    return (
        <div className="flex flex-col gap-4 pb-12">
            {/* ... Header ... */}
            <div className="flex items-center justify-between w-full">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Visitante'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Vamos cuidar da sua saúde hoje?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => updateUserPreferences({ simplified_mode: true })}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        title="Modo Simplificado"
                    >
                        <Armchair size={20} />
                        <span className="hidden sm:inline">Modo Idoso</span>
                    </button>
                    <button
                        onClick={() => setStartTour(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                    >
                        <CircleHelp size={18} />
                        <span className="font-semibold block sm:hidden">Manual</span>
                        <span className="font-semibold hidden sm:block">Como usar</span>
                    </button>
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

            {/* Local Offers Carousel (NEW) */}
            <div className="mt-4 sm:mt-0">
                <LocalOffersCarousel userIbge={user?.user_metadata?.ibge_code} />
            </div>

            {/* Motivation Card */}
            <MotivationCard />

            {/* Low Stock Alert */}
            {(() => {
                const lowStockMeds = medications.filter(med => {
                    const days = calculateStockDays ? calculateStockDays(med.id) : null;
                    return days !== null && days <= 3;
                });

                if (lowStockMeds.length > 0) {
                    return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2 shadow-sm mb-2">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-100 rounded-full text-amber-700 shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-900 text-lg">Estoque Baixo</h3>
                                    <p className="text-amber-800 mb-3 leading-tight">
                                        Você tem medicamentos que vão acabar em breve.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {lowStockMeds.map(med => {
                                            const days = Math.floor(calculateStockDays(med.id));
                                            return (
                                                <div key={med.id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-amber-100">
                                                    <span className="font-medium text-amber-900 flex items-center gap-2">
                                                        <Pill size={16} className="text-amber-600" />
                                                        {med.name}
                                                    </span>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${days <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {days === 0 ? 'Acaba hoje!' : `${days} dia(s)`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

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
                        <StatsCardShimmer />
                    </>
                ) : (
                    <>
                        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-900/20 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <CardContent className="p-4 relative z-10">
                                {(() => {
                                    const now = new Date();
                                    const currentTime = formatTime(now);

                                    const nextDose = todaysSchedule.find(item =>
                                        !item.isTaken && item.time >= currentTime
                                    );

                                    if (nextDose) {
                                        const [hours, minutes] = nextDose.time.split(':').map(Number);
                                        const doseDate = new Date();
                                        doseDate.setHours(hours, minutes, 0, 0);
                                        const diffMinutes = Math.round((doseDate - now) / 60000);

                                        let timeText;
                                        if (diffMinutes < 0) timeText = 'Agora';
                                        else if (diffMinutes < 60) timeText = `Em ${diffMinutes} min`;
                                        else {
                                            const h = Math.floor(diffMinutes / 60);
                                            const m = diffMinutes % 60;
                                            timeText = `Em ${h}h ${m > 0 ? `${m}min` : ''}`;
                                        }

                                        return (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-50 text-xs font-medium backdrop-blur-sm border border-blue-400/30">
                                                            <Clock size={12} />
                                                            Próxima Dose
                                                        </span>

                                                        {/* BIG Visual Identity for Accessibility */}
                                                        <div className="flex items-center gap-4 mt-3">
                                                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                                                                <PillIcon
                                                                    shape={nextDose.medication?.shape || 'round'}
                                                                    color={nextDose.medication?.color || 'white'}
                                                                    size={48}
                                                                    className="drop-shadow-md"
                                                                />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-3xl font-bold">{nextDose.medicationName}</h3>
                                                                <p className="text-blue-100 text-xl font-medium">
                                                                    {Number(nextDose.doseAmount)} {nextDose.medicationType} {nextDose.dosage}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-4xl font-bold tracking-tight">{nextDose.time}</div>
                                                        <div className="text-blue-200 font-medium text-lg mt-1">{timeText}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-blue-100 bg-blue-800/20 p-3 rounded-lg backdrop-blur-sm mt-2">
                                                    <User size={16} />
                                                    Paciente: <span className="font-bold">{nextDose.patientName}</span>
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

                        <Card id="tour-summary-card" className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                            <CardContent className="p-3 flex flex-col gap-2 relative z-10">
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

                                            {/* Restored Message Box with Compact Padding */}
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2.5">
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

                            {/* Decorative Background Elements */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                        </Card>
                    </>
                )}

                {/* Card de Próxima Consulta */}
                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden group">
                    <CardContent className="p-3 flex flex-col gap-2 relative z-10">
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
                            <div className="flex flex-col items-center justify-center py-2">
                                <p className="text-[10px] text-slate-400 text-center italic">
                                    Nenhuma consulta agendada
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-50 rounded-full blur-xl opacity-50 group-hover:scale-150 transition-transform"></div>
                </Card>
            </div>

            {/* Sponsor Display (Banner) */}
            <SponsorDisplay user={user} variant="banner" />

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
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-900">Atenção: Doses Atrasadas</h3>
                                        <p className="text-sm text-red-700 mb-3">
                                            Você tem {lateDoses.length} medicamento{lateDoses.length > 1 ? 's' : ''} pendente{lateDoses.length > 1 ? 's' : ''} de horários passados.
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {lateDoses.map(dose => (
                                                <div key={dose.id} className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-red-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-red-800">{dose.time}</span>
                                                        <span className="text-red-900">{dose.medicationName}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleStatus(dose)}
                                                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-red-700 transition-colors"
                                                    >
                                                        Tomar Agora
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                    {selectedDate === new Date().toISOString().split('T')[0] ? 'Próximos Horários' : 'Horários do Dia'}
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

                                    return (
                                        <Card key={item.id} className={clsx("transition-all", item.isTaken && "opacity-60 bg-[#f8fafc]")}>
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex flex-col items-center gap-1 mr-2 px-2">
                                                        <span className={clsx("font-bold text-lg", item.isTaken ? "text-slate-400" : "text-slate-900")}>
                                                            {item.time}
                                                        </span>
                                                        <div className={clsx(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all",
                                                            item.isTaken
                                                                ? "bg-slate-50 border-slate-200 opacity-60 grayscale"
                                                                : "bg-white border-slate-100"
                                                        )}>
                                                            <PillIcon shape={item.shape} color={item.color} size={28} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={clsx("font-bold", item.isTaken ? "text-[#64748b] line-through" : "text-[#0f172a]")}>
                                                            {Number(item.doseAmount)} {item.medicationType} {item.medicationName} {item.dosage}
                                                        </h3>
                                                        <p className="text-sm text-[#64748b]">{item.patientName}</p>
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
                                                                ? "bg-[#10b981] text-white hover:bg-[#059669]"
                                                                : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] hover:text-[#64748b]"
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
        </div >
    );
};

export default Home;
