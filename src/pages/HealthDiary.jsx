import React, { useState } from 'react';
import PillIcon from '../components/ui/PillIcon';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Trash2, Edit2, Plus, Calendar as CalendarIcon, FileDown, Share2, Clock, CheckCircle2, XCircle, AlertCircle, Circle, Printer, Mail, MessageCircle, FileText, Activity, Heart, Weight, Thermometer, Edit, Pill, SmilePlus, Frown, X, Info, RotateCcw, Brain, Zap, Coffee, HeartPulse } from 'lucide-react';
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormatter';
import { generatePDFHealthDiary } from '../utils/pdfGenerator';
import { generateHealthReportText } from '../utils/reportGenerators';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import CalendarView from '../components/features/CalendarView';
import Pagination from '../components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getApiEndpoint } from '../config/api';
import SymptomSelector from '../components/features/SymptomSelector'; // Imported Component
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const HealthDiary = () => {
    const { patients, healthLogs, addHealthLog, updateHealthLog, deleteHealthLog, user, showToast, prescriptions, consumptionLog, medications, logConsumption, removeConsumption, symptomLogs, removeSymptom } = useApp();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('adherence'); // 'adherence' | 'list' | 'charts' | 'symptoms'
    const [selectedPatientId, setSelectedPatientId] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [editingLogId, setEditingLogId] = useState(null);

    // Auto-scroll when switching tabs
    React.useEffect(() => {
        // Scroll to form or top of content
        // Finding the container or just generic window scroll
        const offset = 100; // Offset for sticky headers if any, or just breathing room
        const bodyRect = document.body.getBoundingClientRect().top;
        // Try to find the tab container or just scroll window
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    // Dose Management Modal
    const [doseModalOpen, setDoseModalOpen] = useState(false);
    const [selectedPrescriptionForDosing, setSelectedPrescriptionForDosing] = useState(null);

    const handleDoseClick = (prescription) => {
        setSelectedPrescriptionForDosing(prescription);
        setDoseModalOpen(true);
    };

    const handleToggleDose = async (time, isTaken) => {
        if (!selectedPrescriptionForDosing || !viewDate) return;

        try {
            if (isTaken) {
                // If it is taken, we want to REMOVE it (untake)
                await removeConsumption(selectedPrescriptionForDosing.id, time, viewDate);
                showToast(`Dose das ${time} marcada como NÃO tomada`, 'info');
            } else {
                // If not taken, we want to LOG it (take)
                await logConsumption({
                    prescriptionId: selectedPrescriptionForDosing.id,
                    medicationId: selectedPrescriptionForDosing.medicationId,
                    date: viewDate,
                    scheduledTime: time,
                    takenBy: user?.id,
                    status: 'taken'
                });
                showToast(`Dose das ${time} confirmada com sucesso!`, 'success');
            }
            setDoseModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar dose', 'error');
        }
    };

    const handleEdit = (log) => {
        // Convert stored UTC/ISO date to Local format for input (YYYY-MM-DDTHH:mm)
        // new Date(log.measured_at) creates a date object in local time
        // format(...) returns the local string representation
        const localDateString = format(new Date(log.measured_at), "yyyy-MM-dd'T'HH:mm");

        setFormData({
            patientId: log.patient_id,
            category: log.category,
            value: log.value,
            valueSecondary: log.value_secondary || '',
            measuredAt: localDateString,
            notes: log.notes || ''
        });
        setEditingLogId(log.id);
        setShowForm(true);
    };

    // Email State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({ to: '', observations: '' });
    const [sendingEmail, setSendingEmail] = useState(false);

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);

    const handleDeleteClick = (id) => {
        setLogToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (logToDelete) {
            await deleteHealthLog(logToDelete);
            setShowDeleteModal(false);
            setLogToDelete(null);
        }
    };



    const [formData, setFormData] = useState({
        patientId: '',
        category: 'pressure',
        value: '',
        valueSecondary: '',
        measuredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
    });

    const maxDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");

    const categories = [
        { id: 'pressure', label: 'Pressão Arterial', emoji: '🩺', unit: 'mmHg', icon: Heart, color: '#ef4444' },
        { id: 'glucose', label: 'Glicemia', emoji: '🩸', unit: 'mg/dL', icon: Activity, color: '#3b82f6' },
        { id: 'weight', label: 'Peso', emoji: '⚖️', unit: 'kg', icon: Weight, color: '#fbbf24' },
        { id: 'temperature', label: 'Temperatura', emoji: '🌡️', unit: '°C', icon: Thermometer, color: '#f97316' },
        { id: 'heart_rate', label: 'Batimentos', emoji: '💓', unit: 'bpm', icon: Heart, color: '#ec4899' },
    ];

    const getCategoryInfo = (catId) => categories.find(c => c.id === catId) || { label: 'Outro', unit: '', icon: Activity, color: '#64748b' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId) {
            showToast('Selecione um paciente', 'error');
            return;
        }

        if (new Date(formData.measuredAt) > new Date()) {
            showToast('A data não pode ser futura.', 'error');
            return;
        }

        // Convert Local Input String to UTC ISO String for Storage
        // valid local string: "2025-12-14T20:33" -> new Date() -> Local Date Obj -> toISOString() -> UTC
        const payload = {
            ...formData,
            measuredAt: new Date(formData.measuredAt).toISOString()
        };

        if (editingLogId) {
            await updateHealthLog(editingLogId, payload);
            setEditingLogId(null);
        } else {
            await addHealthLog(payload);
        }

        setShowForm(false);
        setFormData({
            patientId: '',
            category: 'pressure',
            value: '',
            valueSecondary: '',
            measuredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"), // Reset to current local time
            notes: ''
        });
    };

    const filteredLogs = healthLogs.filter(log => {
        const matchPatient = selectedPatientId === 'all' || log.patient_id === selectedPatientId;
        const matchCategory = filterCategory === 'all' || log.category === filterCategory;
        return matchPatient && matchCategory;
    });

    const getChartData = () => {
        const data = [...filteredLogs].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
        return data.map(log => ({
            date: formatDateTime(log.measured_at),
            timestamp: new Date(log.measured_at).getTime(),
            value: log.value,
            valueSecond: log.value_secondary,
            category: log.category,
            notes: log.notes
        }));
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // generateHealthReportText foi movido para utils/reportGenerators.js
    // Uso: generateHealthReportText(filteredLogs, patients, selectedPatientId)

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Informe o email.', 'error');
            return;
        }
        setSendingEmail(true);
        try {
            const doc = await generatePDFHealthDiary(filteredLogs, { patientId: selectedPatientId }, patients);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const filename = `diario - saude - ${format(new Date(), 'dd-MM')}.pdf`;

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(getApiEndpoint('/api/send-email'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token} `
                },
                body: JSON.stringify({
                    to: emailData.to,
                    subject: 'Diário de Saúde - SiG Remédios',
                    text: 'Segue em anexo o relatório de saúde solicitado.',
                    type: 'health-diary',
                    observations: emailData.observations,
                    healthLogsByPatient: (() => {
                        // Agrupar logs por paciente
                        const logsByPatient = {};
                        filteredLogs.forEach(log => {
                            const patientId = log.patient_id;
                            if (!logsByPatient[patientId]) {
                                logsByPatient[patientId] = [];
                            }
                            logsByPatient[patientId].push(log);
                        });

                        // Ordenar cada grupo por data e formatar
                        return Object.entries(logsByPatient).map(([patientId, logs]) => {
                            const patient = patients.find(p => p.id === patientId);
                            const sortedLogs = logs
                                .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
                                .slice(0, 30)
                                .map(log => ({
                                    date: formatDateTime(log.measured_at),
                                    category: getCategoryInfo(log.category).label,
                                    value: log.value_secondary
                                        ? `${log.value} / ${log.value_secondary} ${getCategoryInfo(log.category).unit}`
                                        : `${log.value} ${getCategoryInfo(log.category).unit}`,
                                    notes: log.notes || '-'
                                }));

                            return {
                                patientName: patient?.name || 'Desconhecido',
                                patientId: patientId,
                                count: logs.length,
                                logs: sortedLogs
                            };
                        });
                    })(),
                    attachments: [{
                        filename: filename,
                        content: pdfBase64,
                        encoding: 'base64'
                    }]
                })
            });

            if (!response.ok) throw new Error('Falha no envio');

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });

            showToast('Email enviado!', 'success');
            setShowEmailModal(false);
        } catch (error) {
            console.error(error);
            showToast('Erro ao enviar email', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleWhatsApp = () => {
        const text = generateHealthReportText(filteredLogs, patients, selectedPatientId);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handlePrint = async (e) => {
        if (e) e.preventDefault();
        try {
            // Determine filter date range based on View (Day or All)
            let logsToPrint = filteredLogs;

            if (viewDate) {
                // Filter HEALTH LOGS by viewDate (Local Time match)
                logsToPrint = filteredLogs.filter(log => {
                    const localDate = format(new Date(log.measured_at), 'yyyy-MM-dd');
                    return localDate === viewDate;
                });
            }

            // 2. Prepare Medication Schedule (Taken AND Pending/Missed)
            let dailyMedicationSchedule = [];

            if (viewDate) {
                // If specific day selected, generate FULL schedule (prescriptions active today)
                const targetDate = viewDate; // yyyy-mm-dd

                // Generate slots for each prescription
                console.log(`[DEBUG] Filtering prescriptions for date: ${targetDate}`);
                console.log(`[DEBUG] Total prescriptions: ${prescriptions.length}`);

                // UI MATCHING LOGIC
                const activePrescriptions = prescriptions.filter(p => {
                    const dateStr = targetDate;
                    const d = new Date(dateStr + 'T00:00:00');
                    const start = new Date(p.startDate);
                    const end = new Date(p.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);

                    // Debug Log similar to previous one but with Objects
                    // console.log(`[DEBUG] Presc ${p.id}, D:${d.toISOString()}, S:${start.toISOString()}, E:${end ? end.toISOString() : 'null'}`);

                    if (p.continuousUse) return d >= start;
                    return d >= start && d <= end;
                });

                console.log(`[DEBUG] Active prescriptions found: ${activePrescriptions.length}`);

                // Generate slots for each prescription
                activePrescriptions.forEach(pres => {
                    const med = medications.find(m => m.id === pres.medicationId);

                    if (pres.times && Array.isArray(pres.times)) {
                        pres.times.forEach(time => {
                            // Find matching log
                            const log = consumptionLog.find(l =>
                                l.prescriptionId === pres.id &&
                                l.date === targetDate &&
                                l.scheduledTime === time
                            );

                            // Calculate Status
                            let status = 'Pendente';
                            let takenByName = null;

                            if (log) {
                                status = 'Tomado'; // taken
                                takenByName = log.takenByName; // or profile join
                            } else {
                                // Logic for Missed/Late
                                const now = new Date();
                                const todayStr = format(now, 'yyyy-MM-dd');

                                if (targetDate < todayStr) {
                                    status = 'Não Tomado';
                                } else if (targetDate === todayStr) {
                                    const [h, m] = time.split(':').map(Number);
                                    const schedDate = new Date();
                                    schedDate.setHours(h, m, 0, 0);
                                    const diffMins = (now - schedDate) / (1000 * 60);

                                    if (diffMins > 30) status = 'Atrasado';
                                }
                            }

                            dailyMedicationSchedule.push({
                                date: targetDate, // For sorting comp in pdfGen
                                scheduledTime: time,
                                medicationName: med?.name || 'Medicamento',
                                patientId: pres.patientId,
                                status: status,
                                takenByName: takenByName
                            });
                        });
                    }
                });

            } else {
                // Fallback for All Time View (Only Taken logs)
                dailyMedicationSchedule = consumptionLog
                    .filter(log => {
                        const pres = prescriptions.find(p => p.id === log.prescriptionId);
                        if (!pres) return false;
                        if (selectedPatientId !== 'all' && pres.patientId !== selectedPatientId) return false;
                        return true;
                    })
                    .map(log => {
                        const pres = prescriptions.find(p => p.id === log.prescriptionId);
                        const med = pres ? medications.find(m => m.id === pres.medicationId) : null;
                        return {
                            ...log,
                            status: 'Tomado', // If valid log exists
                            patientId: pres?.patientId,
                            medicationName: med?.name || 'Medicamento Desconhecido'
                        };
                    });
            }

            console.log(`[DEBUG] Final dailyMedicationSchedule:`, dailyMedicationSchedule);

            const doc = await generatePDFHealthDiary(logsToPrint, { patientId: selectedPatientId, date: viewDate }, patients, dailyMedicationSchedule);
            // doc.autoPrint(); // Removed to fix "two screens" issue
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error(error);
            showToast('Erro ao imprimir', 'error');
        }
    };

    // handlePrint_Legacy foi removido - código legado não utilizado

    return (
        <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500 max-w-6xl mx-auto w-full px-4 md:px-6">
            {activeTab !== 'symptoms' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Diário de Saúde</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Registre e acompanhe sua pressão, glicemia e mais.</p>
                    </div>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="shadow-xl shadow-primary/20">
                            <Plus size={20} className="mr-2" />
                            Novo Registro
                        </Button>
                    )}
                </div>
            )}

            {!showForm && (
                <>
                    {/* 1. ABAS DE NAVEGAÇÃO (Topo) - Premium Segmented Control */}
                    {activeTab !== 'symptoms' ? (
                        <div className="bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-3xl mb-6 no-print">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                <button
                                    onClick={() => setActiveTab('adherence')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === 'adherence'
                                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <CalendarIcon size={18} />
                                    Frequência
                                </button>
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === 'list'
                                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <FileText size={18} />
                                    Sinais Vitais
                                </button>
                                <button
                                    onClick={() => setActiveTab('symptoms')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === 'symptoms'
                                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <SmilePlus size={18} />
                                    Sintomas
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 no-print animate-in slide-in-from-right-4">


                            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 p-6 rounded-2xl shadow-lg shadow-indigo-100">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                        <SmilePlus size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold leading-none">Meus Sintomas</h2>
                                        <p className="text-indigo-100 text-sm mt-1 opacity-80">Registre como você está se sentindo agora</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. BARRA DE FERRAMENTAS (Filtros + Ações) - Apenas se não for Sintomas */}
                    {!showForm && activeTab !== 'symptoms' && (
                        <Card className="no-print mb-6">
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-6">
                                    {/* Filtros */}
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                        <select
                                            id="filter-patient-select"
                                            name="selectedPatientId"
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm"
                                            value={selectedPatientId}
                                            onChange={e => setSelectedPatientId(e.target.value)}
                                        >
                                            <option value="all">Todos os Pacientes</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <select
                                            id="filter-category-select"
                                            name="filterCategory"
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm"
                                            value={filterCategory}
                                            onChange={e => setFilterCategory(e.target.value)}
                                        >
                                            <option value="all">📂 Todas as Categorias</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.emoji} {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quick Actions Panel - Senior UI/UX Refinement */}
                                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 no-print">
                                        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowEmailModal(true)}
                                                className="bg-white dark:bg-slate-700 h-10 border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50"
                                            >
                                                <Mail size={16} className="mr-2" /> Email
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handlePrint}
                                                className="bg-white dark:bg-slate-700 h-10 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                                            >
                                                <Printer size={16} className="mr-2" /> Imprimir
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleWhatsApp}
                                                className="bg-white dark:bg-slate-700 h-10 border-slate-200 dark:border-slate-600 text-green-600 dark:text-green-400 hover:bg-green-50"
                                            >
                                                <MessageCircle size={16} className="mr-2" /> WhatsApp
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {showForm && (
                <Card className="border-l-4 border-l-primary shadow-2xl">
                    <CardHeader className="flex justify-between">
                        <h3 className="font-bold text-xl">Novo Registro</h3>
                        <Button variant="ghost" onClick={() => setShowForm(false)}><Plus className="rotate-45" /></Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    id="patient-select"
                                    name="patientId"
                                    className="h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                    value={formData.patientId}
                                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione o Paciente</option>
                                    {patients.filter(p => p.userId === user?.id || p.sharedWith?.length).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <select
                                    id="category-select"
                                    name="category"
                                    className="h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.emoji} {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="value-input" className="text-sm font-bold text-slate-700">Valor Principal</label>
                                    <Input
                                        id="value-input"
                                        name="value"
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 120 (Sistólica) ou 98 (Glicemia)"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        required
                                    />
                                </div>
                                {formData.category === 'pressure' && (
                                    <div>
                                        <label htmlFor="value-secondary-input" className="text-sm font-bold text-slate-700">Valor Secundário</label>
                                        <Input
                                            id="value-secondary-input"
                                            name="valueSecondary"
                                            type="number"
                                            step="0.1"
                                            placeholder="Ex: 80 (Diastólica)"
                                            value={formData.valueSecondary}
                                            onChange={e => setFormData({ ...formData, valueSecondary: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <Input
                                id="measured-at-input"
                                name="measuredAt"
                                type="datetime-local"
                                label="Data e Hora"
                                value={formData.measuredAt}
                                onChange={e => setFormData({ ...formData, measuredAt: e.target.value })}
                                max={maxDate}
                                required
                            />

                            <Input
                                id="notes-input"
                                name="notes"
                                label="Observações"
                                placeholder="Ex: Sentiu tontura, Jejum, etc."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />

                            <div className="flex gap-4 mt-2">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1">Salvar Registro</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!showForm && (
                <>


                    {activeTab === 'adherence' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <CalendarView
                                        prescriptions={prescriptions}
                                        consumptionLog={consumptionLog}
                                        healthLogs={healthLogs}
                                        selectedDate={viewDate}
                                        onDateSelect={(date) => {
                                            setViewDate(date);
                                        }}
                                    />
                                </div>
                                <div>
                                    <Card className="h-full bg-slate-50 border-none shadow-inner">
                                        <CardContent className="p-6">
                                            {viewDate ? (
                                                <div className="animate-in slide-in-from-right-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                            <CalendarIcon size={20} className="text-primary" />
                                                            {formatDate(viewDate)}
                                                        </h3>
                                                        <button onClick={() => setViewDate(null)} className="text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                                                            Fechar
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Sinais Vitais</h4>
                                                            {healthLogs.filter(l =>
                                                                l.measured_at.startsWith(viewDate) &&
                                                                (selectedPatientId === 'all' || l.patient_id === selectedPatientId)
                                                            ).length > 0 ? (
                                                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                                                    {healthLogs.filter(l =>
                                                                        l.measured_at.startsWith(viewDate) &&
                                                                        (selectedPatientId === 'all' || l.patient_id === selectedPatientId)
                                                                    ).map(log => {
                                                                        const info = getCategoryInfo(log.category);
                                                                        const Icon = info.icon;
                                                                        const patientName = patients.find(p => p.id === log.patient_id)?.name || 'Desconhecido';

                                                                        return (
                                                                            <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                                                                {/* Patient Name Header - Centered */}
                                                                                <div className="flex justify-center border-b border-slate-50 pb-2 mb-1">
                                                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-center truncate max-w-full">
                                                                                        {patientName}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-start justify-between gap-3">
                                                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                                        <div className="p-2 rounded-full bg-slate-50 text-slate-500 shrink-0 mt-0.5">
                                                                                            <Icon size={16} />
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <div className="font-bold text-slate-700 text-sm leading-tight break-words">
                                                                                                {info.label}
                                                                                            </div>
                                                                                            <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                                                                                {formatTime(log.measured_at)}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-start gap-2 shrink-0 pl-2">
                                                                                        <div className="text-right">
                                                                                            <div className="font-bold whitespace-nowrap text-sm" style={{ color: info.color }}>
                                                                                                {log.value}
                                                                                                <span className="text-[10px] text-slate-400 mx-1">{info.unit}</span>
                                                                                                {log.value_secondary && <span className="text-xs text-slate-400">/ {log.value_secondary}</span>}
                                                                                            </div>
                                                                                        </div>
                                                                                        {(user?.id === log.user_id) && (
                                                                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                                                                <button
                                                                                                    onClick={() => handleEdit(log)}
                                                                                                    className="text-blue-400 hover:text-blue-600 p-1"
                                                                                                    title="Editar"
                                                                                                >
                                                                                                    <Edit size={12} />
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleDeleteClick(log.id)}
                                                                                                    className="text-rose-400 hover:text-rose-600 p-1"
                                                                                                    title="Excluir"
                                                                                                >
                                                                                                    <Trash2 size={12} />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {log.notes && (
                                                                                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic mt-1 leading-relaxed">
                                                                                        {log.notes}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-slate-200">
                                                                    <p className="text-sm text-slate-400 italic">Nenhum sinal vital registrado.</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-6 border-t border-slate-100 pt-4">
                                                            <h4 className="text-slate-800 font-bold mb-1 text-sm flex items-center gap-2 uppercase tracking-wide">
                                                                <Pill size={16} className="text-primary" />
                                                                Medicamentos ({formatDate(viewDate)})
                                                            </h4>
                                                            <p className="text-xs text-slate-500 mb-4 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                                                                <Info size={14} />
                                                                Clique no cartão do medicamento abaixo para confirmar a dose.
                                                            </p>

                                                            <div className="flex flex-col gap-2">
                                                                {prescriptions.filter(p => {
                                                                    if (selectedPatientId !== 'all' && p.patientId !== selectedPatientId) return false;

                                                                    const dateStr = viewDate;
                                                                    const d = new Date(dateStr + 'T00:00:00');
                                                                    const start = new Date(p.startDate);
                                                                    const end = new Date(p.endDate);
                                                                    start.setHours(0, 0, 0, 0);
                                                                    end.setHours(0, 0, 0, 0);

                                                                    if (p.continuousUse) return d >= start;
                                                                    return d >= start && d <= end;
                                                                }).length > 0 ? (
                                                                    prescriptions.filter(p => {
                                                                        if (selectedPatientId !== 'all' && p.patientId !== selectedPatientId) return false;

                                                                        const dateStr = viewDate;
                                                                        const d = new Date(dateStr + 'T00:00:00');
                                                                        const start = new Date(p.startDate);
                                                                        const end = new Date(p.endDate);
                                                                        start.setHours(0, 0, 0, 0);
                                                                        end.setHours(0, 0, 0, 0);

                                                                        if (p.continuousUse) return d >= start;
                                                                        return d >= start && d <= end;
                                                                    }).map(prescription => {
                                                                        const med = medications.find(m => m.id === prescription.medicationId);
                                                                        const patientName = patients.find(p => p.id === prescription.patientId)?.name || 'Desconhecido';

                                                                        // Check status for this day
                                                                        const expectedCount = prescription.times ? prescription.times.length : 0;
                                                                        const takenCount = consumptionLog.filter(l =>
                                                                            l.prescriptionId === prescription.id &&
                                                                            l.date === viewDate &&
                                                                            l.status === 'taken'
                                                                        ).length;

                                                                        let statusColor = 'bg-slate-100 text-slate-500';
                                                                        let statusText = 'Pendente';

                                                                        if (takenCount >= expectedCount && expectedCount > 0) {
                                                                            statusColor = 'bg-emerald-100 text-emerald-700';
                                                                            statusText = 'Tomado';
                                                                        } else if (takenCount > 0) {
                                                                            statusColor = 'bg-amber-100 text-amber-700';
                                                                            statusText = 'Parcial';
                                                                        } else if (new Date(viewDate) < new Date().setHours(0, 0, 0, 0)) {
                                                                            statusColor = 'bg-rose-100 text-rose-700';
                                                                            statusText = 'Não Tomado';
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={prescription.id}
                                                                                onClick={() => handleDoseClick(prescription)}
                                                                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-[0.98]"
                                                                                title="Clique para gerenciar doses"
                                                                            >
                                                                                {/* Patient Name Header - Centered */}
                                                                                <div className="flex justify-center border-b border-slate-50 pb-2 mb-1">
                                                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-center truncate max-w-full">
                                                                                        {patientName}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex flex-col gap-1.5">
                                                                                    {/* Row 1: Icon (Small) + Name */}
                                                                                    <div className="flex items-start gap-2">
                                                                                        <div className="w-7 h-7 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 mt-1">
                                                                                            <PillIcon shape={med?.shape} color={med?.color} size={14} />
                                                                                        </div>
                                                                                        <h3 className="font-bold text-slate-900 leading-tight text-base break-words flex-1 pt-1.5">
                                                                                            {med?.name}
                                                                                        </h3>
                                                                                    </div>

                                                                                    <div className="flex flex-col gap-2">
                                                                                        {/* Row 2: Dosage Details (Full Width for clarity) */}
                                                                                        <p className="text-sm font-medium text-slate-700">
                                                                                            {Number(prescription.doseAmount)} {med?.type || ''} • {med?.dosage}
                                                                                        </p>

                                                                                        {/* Row 3: Frequency & Status */}
                                                                                        <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-2 mt-0.5">
                                                                                            <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                                                                {prescription.times?.length}x ao dia • {prescription.times?.join(' - ')}
                                                                                            </p>

                                                                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${statusColor}`}>
                                                                                                {statusText}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                                        <p className="text-sm text-slate-400 italic">Sem medicamentos agendados.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                        <Pill size={20} />
                                                        Resumo do Mês
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-slate-500">
                                                            Clique em um dia no calendário para ver os detalhes registrados.
                                                        </p>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                            <div className="text-sm font-bold text-slate-700 mb-2">Legenda Visual:</div>
                                                            <ul className="space-y-2 text-sm text-slate-600">
                                                                <li className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                                    <span>Tudo correto (100%)</span>
                                                                </li>
                                                                <li className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                                    <span>Registros (Sinais Vitais)</span>
                                                                </li>
                                                                <li className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                                                    <span>Parcial (Alguns esquecidos)</span>
                                                                </li>
                                                                <li className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                                                    <span>Dia sem registros (0%)</span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div className="flex flex-col gap-4">
                            {filteredLogs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                                    Nenhum registro encontrado.
                                </div>
                            ) : (
                                paginatedLogs.map(log => {
                                    const info = getCategoryInfo(log.category);
                                    const Icon = info.icon;
                                    return (
                                        <Card key={log.id} className="group hover:border-primary/30 transition-all">
                                            <div className="flex items-center p-4 gap-4">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: info.color }}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{info.emoji} {info.label}</h4>
                                                            <p className="text-xs text-slate-500">{formatDateTime(log.measured_at)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold" style={{ color: info.color }}>
                                                                {log.value}
                                                                {log.value_secondary && <span className="text-sm opacity-75">/{log.value_secondary}</span>}
                                                                <span className="text-sm ml-1 text-slate-400 font-normal">{info.unit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {log.notes && (
                                                        <div className="mt-2 bg-slate-50 p-2 rounded text-sm text-slate-600">
                                                            {log.notes}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                                            {patients.find(p => p.id === log.patient_id)?.name || 'Desconhecido'}
                                                        </span>
                                                        {(user?.id === log.user_id) && (
                                                            <button
                                                                onClick={() => deleteHealthLog(log.id)}
                                                                className="text-rose-400 hover:text-rose-600 p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                            {filteredLogs.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <Card>
                            <CardContent className="h-96 pt-6">
                                {filteredLogs.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={300} debounce={50}>
                                        <LineChart data={getChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                name="Valor Principal"
                                                stroke="#3b82f6"
                                                activeDot={{ r: 8 }}
                                                strokeWidth={2}
                                            />
                                            {filteredLogs.some(l => l.value_secondary) && (
                                                <Line
                                                    type="monotone"
                                                    dataKey="valueSecond"
                                                    name="Secundário (Diastólica)"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                />
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Sem dados para o gráfico.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )
            }

            {
                activeTab === 'symptoms' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2">
                            <SymptomSelector />
                        </div>
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <FileText className="text-primary" size={20} />
                                        Histórico de Sintomas
                                    </h3>
                                </CardHeader>
                                <CardContent>
                                    {symptomLogs && symptomLogs.length > 0 ? (
                                        <div className="space-y-3">
                                            {symptomLogs.map((log) => (
                                                <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className={`p-2 rounded-full h-fit mt-1 
                                                        ${log.intensity <= 2 ? 'bg-green-100 text-green-600' :
                                                                log.intensity <= 3 ? 'bg-yellow-100 text-yellow-600' :
                                                                    'bg-red-100 text-red-600'
                                                            }`}>
                                                            {log.symptom === 'Dor de Cabeça' && <Brain size={18} />}
                                                            {log.symptom === 'Enjoo' && <Frown size={18} />}
                                                            {log.symptom === 'Tontura' && <Activity size={18} />}
                                                            {log.symptom === 'Cansaço' && <Coffee size={18} />}
                                                            {log.symptom === 'Febre' && <Thermometer size={18} />}
                                                            {log.symptom === 'Dor no Corpo' && <Zap size={18} />}
                                                            {log.symptom === 'Cólicas' && <AlertCircle size={18} />}
                                                            {log.symptom === 'Palpitação' && <HeartPulse size={18} />}
                                                            {/* Fallback Icon */}
                                                            {!['Dor de Cabeça', 'Enjoo', 'Tontura', 'Cansaço', 'Febre', 'Dor no Corpo', 'Cólicas', 'Palpitação'].includes(log.symptom) && <Activity size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{log.symptom}</p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                                <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    Nível {log.intensity}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{formatDateTime(log.created_at)}</span>
                                                            </div>
                                                            {log.notes && (
                                                                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-md italic">
                                                                    "{log.notes}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Excluir este sintoma?')) {
                                                                removeSymptom(log.id);
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-rose-500 p-2 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <SmilePlus size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Nenhum sintoma registrado.</p>
                                            <p className="text-sm">Selecione um ícone ao lado para começar.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )
            }


            <Modal
                isOpen={showEmailModal}
                onClose={() => !sendingEmail && setShowEmailModal(false)}
                title="Enviar Relatório de Saúde"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowEmailModal(false)} disabled={sendingEmail}>Cancelar</Button>
                        <Button onClick={handleSendEmail} disabled={sendingEmail}>
                            {sendingEmail ? 'Enviando...' : 'Enviar Email'}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-500">
                        O relatório incluirá a tabela e os gráficos (link) dos filtros atuais.
                    </p>
                    <Input
                        label="Para:"
                        placeholder="email@exemplo.com, outro@email.com"
                        value={emailData.to}
                        onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                    />
                    <p className="text-xs text-slate-400 -mt-3">Separe por vírgula para múltiplos destinatários.</p>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Excluir Registro de Saúde"
                description="Tem certeza que deseja excluir este registro de sinal vital? Esta ação não pode ser desfeita."
            />
            {/* Dose Management Modal */}
            <Modal
                isOpen={doseModalOpen}
                onClose={() => setDoseModalOpen(false)}
                title="Gerenciar Doses"
                footer={<Button onClick={() => setDoseModalOpen(false)}>Fechar</Button>}
            >
                {selectedPrescriptionForDosing && viewDate && (() => {
                    const med = medications.find(m => m.id === selectedPrescriptionForDosing.medicationId);
                    return (
                        <div className="flex flex-col gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                                <h4 className="font-bold text-slate-900">{med?.name}</h4>
                                <p className="text-sm text-slate-500">
                                    {selectedPrescriptionForDosing.doseAmount} {med?.unit} • {formatDate(viewDate)}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
                                    Horários Agendados
                                </p>
                                {selectedPrescriptionForDosing.times?.map(time => {
                                    // Check if taken
                                    const isTaken = consumptionLog.some(l =>
                                        l.prescriptionId === selectedPrescriptionForDosing.id &&
                                        l.date === viewDate &&
                                        l.status === 'taken' &&
                                        l.scheduledTime === time
                                    );

                                    // Calculate Status Detail
                                    let statusLabel = 'Pendente';
                                    let statusBg = 'bg-slate-100 text-slate-500';
                                    let StatusIcon = Circle;

                                    if (isTaken) {
                                        statusLabel = 'Tomado';
                                        statusBg = 'bg-emerald-100 text-emerald-700';
                                        StatusIcon = CheckCircle2;
                                    } else {
                                        const now = new Date();
                                        const viewDateObj = new Date(viewDate + 'T00:00:00');
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        // Parse scheduled time
                                        const [h, m] = time.split(':').map(Number);
                                        const scheduledDate = new Date(viewDate + 'T00:00:00');
                                        scheduledDate.setHours(h, m, 0, 0);

                                        if (viewDateObj < today) {
                                            statusLabel = 'Não Tomado';
                                            statusBg = 'bg-rose-100 text-rose-700';
                                            StatusIcon = XCircle;
                                        } else if (viewDateObj.getTime() === today.getTime()) {
                                            const diffMins = (now - scheduledDate) / (1000 * 60);
                                            if (diffMins > 30) {
                                                statusLabel = 'Atrasado';
                                                statusBg = 'bg-amber-100 text-amber-700';
                                                StatusIcon = AlertCircle;
                                            }
                                        }
                                    }

                                    return (
                                        <div key={time} className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                                            {/* Row 1: Time and Status Label */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={20} className="text-slate-400" />
                                                    <span className="text-xl font-bold text-slate-800">{time}</span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-sm font-bold ${statusBg}`}>
                                                    <StatusIcon size={16} />
                                                    {statusLabel}
                                                </div>
                                            </div>

                                            {/* Row 2: Large Action Button */}
                                            <div className="pt-2">
                                                {isTaken ? (
                                                    <button
                                                        onClick={() => handleToggleDose(time, isTaken)}
                                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-all active:scale-[0.98]"
                                                    >
                                                        <RotateCcw size={20} />
                                                        DESFAZER (Marcar como não tomado)
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleDose(time, isTaken)}
                                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 font-bold text-lg transition-all active:scale-[0.98]"
                                                    >
                                                        <CheckCircle2 size={24} />
                                                        CONFIRMAR QUE TOMEI
                                                    </button>
                                                )}
                                            </div>

                                            {/* Helper Text */}
                                            <p className="text-center text-xs text-slate-400">
                                                {isTaken
                                                    ? "Clique acima se você marcou por engano."
                                                    : "Clique no botão verde para confirmar a dose."}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div >
    );
};

export default HealthDiary;
