import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Heart, Activity, Thermometer, Weight, Plus, Trash2, Calendar, FileText, Mail, Printer, MessageCircle, Pill, Edit } from 'lucide-react';
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormatter';
import { generatePDFHealthDiary } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import CalendarView from '../components/features/CalendarView';
import Pagination from '../components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
    const { patients, healthLogs, addHealthLog, updateHealthLog, deleteHealthLog, user, showToast, prescriptions, consumptionLog } = useApp();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('adherence'); // 'adherence' | 'list' | 'charts'
    const [selectedPatientId, setSelectedPatientId] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const [viewDate, setViewDate] = useState(null);
    const [editingLogId, setEditingLogId] = useState(null);

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
        { id: 'pressure', label: 'Pressão Arterial', unit: 'mmHg', icon: Heart, color: '#ef4444' },
        { id: 'glucose', label: 'Glicemia', unit: 'mg/dL', icon: Activity, color: '#3b82f6' },
        { id: 'weight', label: 'Peso', unit: 'kg', icon: Weight, color: '#fbbf24' },
        { id: 'temperature', label: 'Temperatura', unit: '°C', icon: Thermometer, color: '#f97316' },
        { id: 'heart_rate', label: 'Batimentos', unit: 'bpm', icon: Heart, color: '#ec4899' },
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

    const generateHealthReportText = () => {
        console.log('Generating WhatsApp message. filteredLogs:', filteredLogs.length, 'logs');
        let text = '*DIÁRIO DE SAÚDE*\n';
        text += '========================\n';
        if (selectedPatientId !== 'all') {
            const p = patients.find(pat => pat.id === selectedPatientId);
            text += `*Paciente:* *_${p?.name}_*\n`;
        }

        text += `*Gerado em:* ${formatDateTime(new Date())}\n`;
        text += `*Total de registros:* ${filteredLogs.length}\n`;
        text += '========================\n';


        // Agrupar logs por paciente
        const logsByPatient = {};
        filteredLogs.forEach(log => {
            const patientId = log.patient_id;
            if (!logsByPatient[patientId]) {
                logsByPatient[patientId] = [];
            }
            logsByPatient[patientId].push(log);
        });

        // Ordenar cada grupo por data crescente
        Object.keys(logsByPatient).forEach(patientId => {
            logsByPatient[patientId].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
        });

        // Verificar se há registros
        const totalLogs = Object.values(logsByPatient).reduce((sum, logs) => sum + logs.length, 0);
        if (totalLogs === 0) {
            text += '*Nenhum registro encontrado*\n';
            text += 'Adicione sinais vitais para gerar o relatorio.\n\n';
        } else {
            // Iterar por cada paciente
            Object.entries(logsByPatient).forEach(([patientId, logs], patientIndex) => {
                const patient = patients.find(p => p.id === patientId);
                const patientName = patient?.name || 'Paciente Desconhecido';

                // Cabeçalho do paciente (apenas se houver múltiplos pacientes)
                if (Object.keys(logsByPatient).length > 1) {
                    if (patientIndex > 0) text += '\n';
                    text += `--- *_${patientName}_* ---\n`;
                }

                // Registros do paciente (limitado a 30 total)
                const logsToShow = logs.slice(0, 30);
                logsToShow.forEach((log) => {
                    const info = getCategoryInfo(log.category);

                    // Tag baseada na categoria
                    let tag = '';
                    if (log.category === 'pressure') tag = '[PA]';
                    else if (log.category === 'glucose') tag = '[GLI]';
                    else if (log.category === 'weight') tag = '[PESO]';
                    else if (log.category === 'temperature') tag = '[TEMP]';
                    else if (log.category === 'heart_rate') tag = '[BPM]';
                    else tag = '[REG]';

                    text += `${tag} *${info.label}*\n`;
                    text += `Data: ${formatDateTime(log.measured_at)}\n`;

                    let val = `${log.value}`;
                    if (log.value_secondary) val += ` / ${log.value_secondary}`;
                    val += ` ${info.unit}`;

                    text += `Valor: *${val}*\n`;

                    if (log.notes) {
                        text += `Obs: ${log.notes}\n`;
                    }
                });

                if (logs.length > 30) {
                    text += `_... e mais ${logs.length - 30} registro(s) de ${patientName}_\n`;
                }
            });
        }



        text += '========================\n';
        text += '*SiG Remédios*\n';
        text += 'Gerenciamento de Saúde Familiar\n\n';
        text += 'https://sigremedios.vercel.app';

        return text;
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Informe o email.', 'error');
            return;
        }
        setSendingEmail(true);
        try {
            const doc = await generatePDFHealthDiary(filteredLogs, { patientId: selectedPatientId }, patients);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const filename = `diario-saude-${format(new Date(), 'dd-MM')}.pdf`;

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    to: emailData.to,
                    subject: 'Diário de Saúde - SiG Remédios',
                    text: 'Segue em anexo o relatorio de saude solicitado.',
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
        const text = encodeURIComponent(generateHealthReportText());
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handlePrint = async () => {
        try {
            const doc = await generatePDFHealthDiary(filteredLogs, { patientId: selectedPatientId }, patients);
            doc.autoPrint();
            window.open(doc.output('bloburl'));
        } catch (error) {
            console.error(error);
            showToast('Erro ao imprimir', 'error');
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
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

            {!showForm && (
                <Card className="no-print">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <select
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200"
                                value={selectedPatientId}
                                onChange={e => setSelectedPatientId(e.target.value)}
                            >
                                <option value="all">Todos os Pacientes</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Todas as Categorias</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                    </CardContent>
                </Card>
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
                                    className="px-4 py-3 rounded-xl border border-slate-200"
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
                                    className="px-4 py-3 rounded-xl border border-slate-200"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Valor Principal</label>
                                    <Input
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
                                        <label className="text-sm font-bold text-slate-700">Valor Secundário</label>
                                        <Input
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
                                type="datetime-local"
                                label="Data e Hora"
                                value={formData.measuredAt}
                                onChange={e => setFormData({ ...formData, measuredAt: e.target.value })}
                                max={maxDate}
                                required
                            />

                            <Input
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
                    <div className="flex flex-col md:flex-row gap-4 border-b border-slate-200 no-print justify-between items-center mb-6">
                        <div className="flex gap-4 overflow-x-auto w-full md:w-auto">
                            <button
                                onClick={() => setActiveTab('adherence')}
                                className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'adherence' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                            >
                                <Calendar size={16} />
                                Frequência (Calendário)
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                            >
                                <FileText size={16} />
                                Sinais Vitais
                            </button>
                            <button
                                onClick={() => setActiveTab('charts')}
                                className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'charts' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                            >
                                <Activity size={16} />
                                Gráficos
                            </button>
                        </div>

                        <div className="flex gap-2 no-print overflow-x-auto pb-2">
                            <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
                                <Mail size={16} className="mr-2" /> Email
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer size={16} className="mr-2" /> Imprimir
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleWhatsApp}>
                                <MessageCircle size={16} className="mr-2" /> WhatsApp
                            </Button>
                        </div>
                    </div>

                    {activeTab === 'adherence' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <CalendarView
                                        prescriptions={prescriptions}
                                        consumptionLog={consumptionLog}
                                        healthLogs={healthLogs}
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
                                                            <Calendar size={20} className="text-primary" />
                                                            {formatDate(viewDate)}
                                                        </h3>
                                                        <button onClick={() => setViewDate(null)} className="text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                                                            Fechar
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Sinais Vitais</h4>
                                                            {healthLogs.filter(l => l.measured_at.startsWith(viewDate)).length > 0 ? (
                                                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                                                    {healthLogs.filter(l => l.measured_at.startsWith(viewDate)).map(log => {
                                                                        const info = getCategoryInfo(log.category);
                                                                        const Icon = info.icon;
                                                                        return (
                                                                            <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="p-1.5 rounded-full bg-slate-50 text-slate-500">
                                                                                            <Icon size={14} />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-bold text-slate-700 text-sm">{info.label}</div>
                                                                                            <div className="text-xs text-slate-400">{formatTime(log.measured_at)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-right">
                                                                                            <div className="font-bold" style={{ color: info.color }}>
                                                                                                {log.value} <span className="text-xs text-slate-400">{info.unit}</span>
                                                                                            </div>
                                                                                            {log.value_secondary && <div className="text-xs text-slate-400">/ {log.value_secondary}</div>}
                                                                                            <div className="text-[10px] text-slate-400 mt-1">{formatDateTime(log.measured_at)}</div>
                                                                                        </div>
                                                                                        {(user?.id === log.user_id) && (
                                                                                            <div className="flex flex-col gap-1">
                                                                                                <button
                                                                                                    onClick={() => handleEdit(log)}
                                                                                                    className="text-blue-400 hover:text-blue-600 p-1"
                                                                                                    title="Editar"
                                                                                                >
                                                                                                    <Edit size={14} />
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleDeleteClick(log.id)}
                                                                                                    className="text-rose-400 hover:text-rose-600 p-1"
                                                                                                    title="Excluir"
                                                                                                >
                                                                                                    <Trash2 size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {log.notes && (
                                                                                    <div className="text-xs text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
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

                                                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mt-4">
                                                            <h4 className="text-blue-900 font-bold mb-1 text-sm flex items-center gap-2">
                                                                <Pill size={14} />
                                                                Medicamentos
                                                            </h4>
                                                            <p className="text-blue-700 text-xs leading-relaxed">
                                                                O controle detalhado de tomadas (checkboxes) é feito na tela <strong>Início</strong>.
                                                                Aqui você visualiza a aderência geral do dia.
                                                            </p>
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
                    ) : activeTab === 'list' ? (
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
                                                            <h4 className="font-bold text-slate-900">{info.label}</h4>
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
                    ) : (
                        <Card>
                            <CardContent className="h-96 pt-6">
                                {filteredLogs.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
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
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Excluir Registro"
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                        <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                            Excluir
                        </Button>
                    </>
                )}
            >
                <p className="text-slate-600">
                    Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                </p>
            </Modal>
        </div >
    );
};

export default HealthDiary;
