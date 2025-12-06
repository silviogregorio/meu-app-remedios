import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { Check, Clock, AlertCircle, Calendar, User, Pill, X } from 'lucide-react';
import { formatDate, formatTime, formatDateFull } from '../utils/dateFormatter';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 6;

import { useNotifications } from '../hooks/useNotifications';
import confetti from 'canvas-confetti';

const Home = () => {
    const { user, prescriptions, medications, patients, consumptionLog, logConsumption, removeConsumption } = useApp();
    const { permission, requestPermission } = useNotifications();
    const [todaysSchedule, setTodaysSchedule] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [selectedDate, setSelectedDate] = useState(() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [selectedPatient, setSelectedPatient] = useState('all');
    const [selectedMedication, setSelectedMedication] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    useEffect(() => {
        console.log('Home: Generating schedule', { prescriptions, medications, patients, selectedDate });
        // Generate schedule based on prescriptions and filters
        const schedule = [];

        prescriptions.forEach(presc => {
            const med = medications.find(m => m.id === presc.medicationId);
            const patient = patients.find(p => p.id === presc.patientId);

            // Apply patient filter
            if (selectedPatient !== 'all' && presc.patientId !== selectedPatient) return;

            // Apply medication filter
            if (selectedMedication !== 'all' && presc.medicationId !== selectedMedication) return;

            // Check date range
            const start = new Date(presc.startDate);
            const end = new Date(presc.endDate);
            const current = new Date(selectedDate);

            // Normalize dates to compare only YYYY-MM-DD
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);

            // If current date is before start or after end, skip
            if (current < start || current > end) return;

            if (!presc.times || !Array.isArray(presc.times)) return;

            presc.times.forEach(time => {
                // Check if already taken on selected date
                const takenLog = consumptionLog.find(log =>
                    log.prescriptionId === presc.id &&
                    log.scheduledTime?.substring(0, 5) === time &&
                    log.date === selectedDate
                );

                const isTaken = !!takenLog;

                const item = {
                    id: `${presc.id}-${time}`,
                    prescriptionId: presc.id,
                    medicationName: med?.name,
                    dosage: med?.dosage,
                    patientName: patient?.name,
                    patientId: patient?.id,
                    time: time,
                    isTaken: isTaken,
                    status: isTaken ? 'taken' : 'pending',
                    takenByName: takenLog?.takenByName,
                    doseAmount: presc.doseAmount || 1
                };

                // Apply status filter
                if (selectedStatus === 'all' || item.status === selectedStatus) {
                    schedule.push(item);
                }
            });
        });

        // Sort schedule by time
        schedule.sort((a, b) => a.time.localeCompare(b.time));

        setTodaysSchedule(schedule);

    }, [prescriptions, medications, patients, consumptionLog, selectedDate, selectedPatient, selectedMedication, selectedStatus]);



    const handleToggleStatus = (item) => {
        if (item.isTaken) {
            // Remove consumption log
            removeConsumption(item.prescriptionId, item.time, selectedDate);
        } else {
            // Add consumption log
            logConsumption({
                prescriptionId: item.prescriptionId,
                scheduledTime: item.time,
                date: selectedDate,
                status: 'taken'
            });

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#f59e0b']
            });
        }
    };

    const todayDate = formatDateFull(new Date());

    const clearFilters = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedPatient('all');
        setSelectedMedication('all');
        setSelectedStatus('all');
    };

    const hasActiveFilters = selectedPatient !== 'all' || selectedMedication !== 'all' || selectedStatus !== 'all' || selectedDate !== new Date().toISOString().split('T')[0];

    return (
        <div className="flex flex-col gap-6 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Olá, {user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Usuário') : 'Visitante'}</h1>
                <p className="text-slate-500 dark:text-slate-400 capitalize">{todayDate}</p>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl shadow-blue-900/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <CardContent className="p-6 relative z-10">
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
                                                <h3 className="text-2xl font-bold mt-2">{nextDose.medicationName}</h3>
                                                <p className="text-blue-100 text-lg">
                                                    {Number(nextDose.doseAmount)}x {nextDose.dosage}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold">{nextDose.time}</div>
                                                <div className="text-blue-200 font-medium">{timeText}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-blue-100 bg-blue-800/20 p-3 rounded-lg backdrop-blur-sm">
                                            <User size={16} />
                                            {nextDose.patientName}
                                        </div>
                                    </div>
                                );
                            } else {
                                const allTaken = todaysSchedule.length > 0 && todaysSchedule.every(i => i.isTaken);
                                return (
                                    <div className="flex flex-col items-center justify-center h-full py-2 text-center">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                            {allTaken ? <Check size={24} /> : <Calendar size={24} />}
                                        </div>
                                        <h3 className="text-xl font-bold">
                                            {allTaken ? 'Tudo pronto por hoje!' : 'Sem mais doses hoje'}
                                        </h3>
                                        <p className="text-blue-100">
                                            {allTaken
                                                ? 'Você tomou todos os medicamentos agendados.'
                                                : 'Nenhum medicamento pendente para o resto do dia.'}
                                        </p>
                                    </div>
                                );
                            }
                        })()}
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Progresso Diário</h3>
                            <p className="text-sm text-slate-500">
                                {formatDate(new Date())}
                            </p>
                        </div>

                        {(() => {
                            const total = todaysSchedule.length;
                            const taken = todaysSchedule.filter(i => i.isTaken).length;
                            const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

                            return (
                                <div className="flex flex-col gap-4 mt-4">
                                    <div className="relative pt-2">
                                        <div className="flex mb-2 items-center justify-between">
                                            <div className="text-right w-full">
                                                <span className="text-xs font-semibold inline-block text-primary">
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100">
                                            <div
                                                style={{ width: `${percentage}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 font-medium">{taken} tomados</span>
                                            <span className="text-slate-400">de {total}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>

            {/* Late Doses Alert */}
            {(() => {
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
            })()}

            {/* Low Stock Alert */}
            {(() => {
                const lowStockMeds = medications.filter(med => (med.quantity || 0) < 5);

                if (lowStockMeds.length > 0) {
                    return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-900">Estoque Baixo</h3>
                                    <p className="text-sm text-amber-700 mb-2">
                                        Alguns medicamentos estão acabando. Verifique seu estoque.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {lowStockMeds.map(med => (
                                            <span key={med.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/50 border border-amber-100 text-xs font-medium text-amber-800">
                                                <Pill size={12} />
                                                {med.name} ({med.quantity || 0})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Filters Section */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filtros
                        </h3>
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
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    {selectedDate === new Date().toISOString().split('T')[0] ? 'Próximos Horários' : 'Horários do Dia'}
                </h2>
                <div className="flex flex-col gap-3">
                    {(() => {
                        const totalPages = Math.ceil(todaysSchedule.length / ITEMS_PER_PAGE);
                        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                        const paginatedSchedule = todaysSchedule.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                        return todaysSchedule.length === 0 ? (
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
                                {paginatedSchedule.map(item => (
                                    <Card key={item.id} className={clsx("transition-all", item.isTaken && "opacity-60 bg-[#f8fafc]")}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={clsx(
                                                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border",
                                                    item.isTaken
                                                        ? "bg-[#d1fae5] text-[#059669] border-[#d1fae5]"
                                                        : "bg-white text-[#0f172a] border-[#e2e8f0]"
                                                )}>
                                                    <span className="text-sm">{item.time}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={clsx("font-bold", item.isTaken ? "text-[#64748b] line-through" : "text-[#0f172a]")}>
                                                        {Number(item.doseAmount)}x {item.medicationName} {item.dosage}
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

                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={clsx(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
                                                    item.isTaken
                                                        ? "bg-[#10b981] text-white hover:bg-[#059669]"
                                                        : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] hover:text-[#64748b]"
                                                )}
                                            >
                                                {item.isTaken ? <Check size={20} /> : <Check size={20} />}
                                            </button>
                                        </CardContent>
                                    </Card>
                                ))}

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
        </div>
    );
};

export default Home;
