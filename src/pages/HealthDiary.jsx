import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Heart, Activity, Thermometer, Weight, Plus, Trash2, Calendar, FileText, Mail, Printer, MessageCircle, Pill } from 'lucide-react';
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormatter';
import { generatePDFHealthDiary } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import CalendarView from '../components/features/CalendarView'; // Import CalendarView
import { useNavigate } from 'react-router-dom'; // For navigation

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';


const HealthDiary = () => {
    // Add prescriptions and consumptionLog to destructured values
    const { patients, healthLogs, addHealthLog, deleteHealthLog, user, showToast, prescriptions, consumptionLog } = useApp();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('adherence'); // 'adherence' | 'list' | 'charts'
    const [selectedPatientId, setSelectedPatientId] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Email State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({ to: '', observations: '' });
    const [sendingEmail, setSendingEmail] = useState(false);

    const [formData, setFormData] = useState({
        patientId: '',
        category: 'pressure',
        value: '',
        valueSecondary: '',
        measuredAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        notes: ''
    });

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
        await addHealthLog(formData);
        setShowForm(false);
        setFormData({
            patientId: '',
            category: 'pressure',
            value: '',
            valueSecondary: '',
            measuredAt: new Date().toISOString().slice(0, 16),
            notes: ''
        });
    };

    const filteredLogs = healthLogs.filter(log => {
        const matchPatient = selectedPatientId === 'all' || log.patient_id === selectedPatientId;
        const matchCategory = filterCategory === 'all' || log.category === filterCategory;
        return matchPatient && matchCategory;
    });

    // Chart Data Preparation
    const getChartData = () => {
        // Group by date and sort
        const data = [...filteredLogs].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
        return data.map(log => ({
            date: formatDateTime(log.measured_at),
            timestamp: new Date(log.measured_at).getTime(),
            value: log.value,
            valueSecond: log.value_secondary, // For Diastolic
            category: log.category,
            notes: log.notes
        }));
    };

    // --- Email & Report Logic ---
    const generateHealthReportText = () => {
        let text = '*DIARIO DE SAUDE - RELATORIO*\n\n';
        if (selectedPatientId !== 'all') {
            const p = patients.find(pat => pat.id === selectedPatientId);
            text += `Paciente: ${p?.name}\n`;
        }
        text += '\n';

        filteredLogs.slice(0, 30).forEach(log => {
            const info = getCategoryInfo(log.category);
            let val = `${log.value}`;
            if (log.value_secondary) val += ` / ${log.value_secondary}`;
            val += ` ${info.unit}`;

            text += `${formatDateTime(log.measured_at)} - ${info.label}\n`;
            text += `Valor: ${val}\n`;
            if (log.notes) text += `Obs: ${log.notes}\n`;
            text += '----------------\n';
        });

        return text;
    };

    const generateHealthReportHtml = () => {
        const rows = filteredLogs.slice(0, 50).map(log => {
            const info = getCategoryInfo(log.category);
            let val = `<strong>${log.value}</strong>`;
            if (log.value_secondary) val += ` / <strong>${log.value_secondary}</strong>`;
            val += ` <small>${info.unit}</small>`;

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateTime(log.measured_at)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                             <span>${info.label}</span>
                        </div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${val}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666; font-size: 12px;">${log.notes || '-'}</td>
                </tr>
            `;
        }).join('');

        return `
            <html>
            <body style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Diário de Saúde</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f8fafc;">
                        <tr>
                            <th style="padding: 10px; text-align: left;">Data</th>
                            <th style="padding: 10px; text-align: left;">Categoria</th>
                            <th style="padding: 10px; text-align: left;">Medição</th>
                            <th style="padding: 10px; text-align: left;">Notas</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Informe o email.', 'error');
            return;
        }
        setSendingEmail(true);
        try {
            // Generate PDF
            const doc = await generatePDFHealthDiary(filteredLogs, { patientId: selectedPatientId }, patients);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const filename = `diario-saude-${format(new Date(), 'dd-MM')}.pdf`;

            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Diário de Saúde</h2>
                    <p>Olá,</p>
                    <p>Segue em anexo o seu histórico de saúde (PDF).</p>
                    <br/>
                    <p>Atenciosamente,<br/>Equipe SiG Remédios</p>
                </div>
            `;

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
                    text: 'Segue em anexo o relatório de saúde.',
                    html: html,
                    attachments: [{
                        filename: filename,
                        content: pdfBase64,
                        encoding: 'base64'
                    }]
                })
            });

            if (!response.ok) throw new Error('Falha no envio');

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
            {/* Header */}
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

            {/* Filters */}
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

            {/* Form */}
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

            {/* Tabs */}
            {!showForm && (
                <>
                    <div className="flex gap-4 border-b border-slate-200 no-print">
                        {/* Tabs */}
                        {!showForm && (
                            <>
                                <div className="flex gap-4 border-b border-slate-200 no-print overflow-x-auto">
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
                                        Diário (Sinais Vitais)
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('charts')}
                                        className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'charts' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                                    >
                                        <Activity size={16} />
                                        Gráficos
                                    </button>
                                </div>

                                {/* Actions */}
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

                                {activeTab === 'adherence' ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <CalendarView
                                                    prescriptions={prescriptions}
                                                    consumptionLog={consumptionLog}
                                                    onDateSelect={(date) => {
                                                        // Navigation to Home with this date selected? 
                                                        // Or just show a toast for now as "List view" is in Home.
                                                        // Ideally we should move the list logic here or direct them.
                                                        // Let's redirect to Home with query param? Home doesn't read query param yet.
                                                        // For now, let's just show a simple list of that day below.
                                                        showToast(`Visualizando histórico de ${formatDate(date)}`, 'info');
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Card className="h-full bg-slate-50 border-none shadow-inner">
                                                    <CardContent className="p-6">
                                                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                            <Pill size={20} />
                                                            Resumo do Mês
                                                        </h3>
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-slate-500">
                                                                Use o calendário para visualizar sua aderência ao tratamento.
                                                                Os dias são coloridos baseados se você tomou todas as doses agendadas.
                                                            </p>
                                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                <div className="text-sm font-bold text-slate-700 mb-2">Legenda Visual:</div>
                                                                <ul className="space-y-2 text-sm text-slate-600">
                                                                    <li className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                                        <span>Tudo correto (100%)</span>
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
                                            filteredLogs.map(log => {
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
                        )}

                        {/* Email Modal */}
                        <Modal
                            isOpen={showEmailModal}
                            onClose={() => setShowEmailModal(false)}
                            title="Enviar Relatório de Saúde"
                            footer={
                                <>
                                    <Button variant="ghost" onClick={() => setShowEmailModal(false)}>Cancelar</Button>
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
                    </div>
                    );
};

                    export default HealthDiary;
