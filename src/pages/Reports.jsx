import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { FileText, Printer, Calendar, CheckCircle, Clock, Mail, MessageCircle, Download } from 'lucide-react';
import { formatDate, formatTime, formatDateTime } from '../utils/dateFormatter';
import { generatePDFReport } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabase';

const ITEMS_PER_PAGE = 6;

const Reports = () => {
    const { patients, medications, prescriptions, consumptionLog, showToast } = useApp();

    const getDefaultDates = () => {
        const today = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const startDate = `${year}-${month}-${day}`;

        const endYear = sevenDaysLater.getFullYear();
        const endMonth = String(sevenDaysLater.getMonth() + 1).padStart(2, '0');
        const endDay = String(sevenDaysLater.getDate()).padStart(2, '0');
        const endDate = `${endYear}-${endMonth}-${endDay}`;

        return {
            startDate,
            endDate
        };
    };

    const defaultDates = getDefaultDates();

    const [filters, setFilters] = useState({
        patientId: 'all',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
        status: 'all'
    });

    const [reportData, setReportData] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        to: '',
        observations: ''
    });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filters.status]);

    const generateReport = () => {
        if (!filters.startDate || !filters.endDate) {
            return;
        }

        let filteredPrescriptions = prescriptions;
        if (filters.patientId !== 'all') {
            filteredPrescriptions = prescriptions.filter(
                p => p.patientId === filters.patientId
            );
        }

        const expectedDoses = [];
        filteredPrescriptions.forEach(prescription => {
            const prescStart = new Date(prescription.startDate);
            const prescEnd = new Date(prescription.endDate);
            const filterStart = new Date(filters.startDate);
            const filterEnd = new Date(filters.endDate);

            const start = new Date(Math.max(prescStart, filterStart));
            const end = new Date(Math.min(prescEnd, filterEnd));

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                prescription.times.forEach(time => {
                    expectedDoses.push({
                        date: d.toISOString().split('T')[0],
                        time: time,
                        patientId: prescription.patientId,
                        medicationId: prescription.medicationId,
                        prescriptionId: prescription.id
                    });
                });
            }
        });

        const reportItems = expectedDoses.map(dose => {
            const patient = patients.find(p => p.id === dose.patientId);
            const medication = medications.find(m => m.id === dose.medicationId);

            const taken = consumptionLog.find(log => {
                const match = log.prescriptionId === dose.prescriptionId &&
                    log.date === dose.date &&
                    log.scheduledTime === dose.time;
                return match;
            });

            return {
                date: dose.date,
                time: dose.time,
                patient: patient?.name || 'Desconhecido',
                medication: `${medication?.name} ${medication?.dosage}`,
                status: taken ? 'taken' : 'pending',
                takenAt: taken?.timestamp
            };
        });

        reportItems.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        const summary = {
            total: reportItems.length,
            taken: reportItems.filter(i => i.status === 'taken').length,
            pending: reportItems.filter(i => i.status === 'pending').length
        };
        summary.adherenceRate = summary.total > 0
            ? Math.round((summary.taken / summary.total) * 100)
            : 0;

        setReportData({
            filters,
            summary,
            items: reportItems.sort((a, b) =>
                `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
            )
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        try {
            generatePDFReport(reportData, filters, patients);
            showToast('PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showToast('Erro ao gerar PDF', 'error');
        }
    };

    const generateReportText = () => {
        if (!reportData) return '';

        const filteredItems = reportData.items.filter(
            item => filters.status === 'all' || item.status === filters.status
        );

        let text = '*RELATORIO DE MEDICACOES*\n\n';
        text += '*Periodo:* ' + formatDate(reportData.filters.startDate) + ' ate ' + formatDate(reportData.filters.endDate) + '\n';

        if (reportData.filters.patientId !== 'all') {
            const patient = patients.find(p => p.id === reportData.filters.patientId);
            text += '*Paciente:* ' + patient?.name + '\n';
        }

        text += '\n*RESUMO*\n';
        text += 'Total: ' + reportData.summary.total + '\n';
        text += 'Tomadas: ' + reportData.summary.taken + '\n';
        text += 'Pendentes: ' + reportData.summary.pending + '\n';
        text += 'Taxa de Adesao: ' + reportData.summary.adherenceRate + '%\n';

        text += '\n*DETALHAMENTO*\n';
        filteredItems.slice(0, 20).forEach((item, idx) => {
            const status = item.status === 'taken' ? '[TOMADO]' : '[PENDENTE]';
            text += '\n' + (idx + 1) + '. ' + status + ' ' + formatDate(item.date) + ' as ' + item.time + '\n';
            text += '   ' + item.patient + ' - ' + item.medication + '\n';
        });

        if (filteredItems.length > 20) {
            text += '\n... e mais ' + (filteredItems.length - 20) + ' medicacoes\n';
        }

        text += '\n---\n_Gerado pelo Sistema de Controle de Medicamentos_';

        return text;
    };

    const generateReportHtml = () => {
        if (!reportData) return '';

        const filteredItems = reportData.items.filter(
            item => filters.status === 'all' || item.status === filters.status
        );

        const [startYear, startMonth, startDay] = reportData.filters.startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = reportData.filters.endDate.split('-').map(Number);
        const startDate = formatDate(new Date(startYear, startMonth - 1, startDay));
        const endDate = formatDate(new Date(endYear, endMonth - 1, endDay));

        const patientName = reportData.filters.patientId !== 'all'
            ? patients.find(p => p.id === reportData.filters.patientId)?.name
            : 'Todos os Pacientes';

        const statusFilter = filters.status === 'all' ? 'Todos' : filters.status === 'taken' ? 'Tomadas' : 'Pendentes';

        const rows = filteredItems.slice(0, 50).map(item => {
            const statusColor = item.status === 'taken' ? '#dcfce7' : '#ffedd5';
            const statusText = item.status === 'taken' ? '#166534' : '#9a3412';
            const statusLabel = item.status === 'taken' ? 'TOMADO' : 'PENDENTE';

            const [year, month, day] = item.date.split('-').map(Number);
            const itemDate = formatDate(new Date(year, month - 1, day));

            return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                        <div style="font-weight: bold;">${itemDate}</div>
                        <div style="font-size: 12px; color: #64748b;">${item.time}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                        <div style="font-weight: 600;">${item.medication}</div>
                        <div style="font-size: 12px; color: #64748b;">${item.patient}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="background-color: ${statusColor}; color: ${statusText}; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; display: inline-block;">
                            ${statusLabel}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Relatório de Medicamentos</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">${startDate} até ${endDate}</p>
                        <div style="margin-top: 15px; display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                            ${patientName}
                        </div>
                        <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
                            Status: ${statusFilter}
                        </div>
                    </div>

                    <!-- Summary Grid -->
                    <div style="padding: 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 10px;">
                            <tr>
                                <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                    <div style="font-size: 32px; font-weight: 800; color: #3b82f6;">${reportData.summary.total}</div>
                                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Total de Doses</div>
                                </td>
                                <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                    <div style="font-size: 32px; font-weight: 800; color: #22c55e;">${reportData.summary.taken}</div>
                                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Tomadas</div>
                                </td>
                                <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                    <div style="font-size: 32px; font-weight: 800; color: #8b5cf6;">${reportData.summary.adherenceRate}%</div>
                                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Adesão</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 30px;">
                        <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 18px;">Detalhamento</h3>
                        
                        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                            <table style="width: 100%; min-width: 500px; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; border-radius: 6px 0 0 6px; white-space: nowrap;">Data/Hora</th>
                                        <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase;">Medicamento</th>
                                        <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; border-radius: 0 6px 6px 0;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        </div>

                        ${filteredItems.length > 50 ? `
                            <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px; font-style: italic;">
                                ... e mais ${filteredItems.length - 50} registros
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer -->
                    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; color: #94a3b8; font-size: 14px;">Gerado automaticamente pelo <strong>SiG Remédios</strong></p>
                        ${emailData.observations ? `
                            <div style="margin-top: 20px; padding: 15px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; color: #9a3412; font-size: 14px; text-align: left;">
                                <strong>Observações:</strong><br>${emailData.observations}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleWhatsApp = () => {
        const text = generateReportText();
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleEmail = () => {
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Por favor, informe o email do destinatário', 'error');
            return;
        }

        setSendingEmail(true);

        try {
            const html = generateReportHtml();
            const text = generateReportText(); // Fallback text
            const subject = `Relatório de Medicamentos - ${formatDate(reportData.filters.startDate)}`;

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: emailData.to,
                    subject: subject,
                    text: text,
                    html: html,
                    observations: emailData.observations
                }
            });

            if (error) throw error;

            showToast('Email enviado com sucesso!', 'success');
            setShowEmailModal(false);
            setEmailData({ to: '', observations: '' });
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            showToast(error.message || 'Erro ao enviar email. Verifique se a Edge Function está configurada.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const filteredReportItems = reportData?.items.filter(
        item => filters.status === 'all' || item.status === filters.status
    ) || [];
    const totalPages = Math.ceil(filteredReportItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredReportItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <>
            <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500 print:hidden">
                <div className="no-print">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Relatórios</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Visualize e imprima relatórios de medicações.</p>
                </div>

                <Card className="no-print">
                    <CardHeader>
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">Filtros do Relatório</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Selecione o paciente, período e status desejado</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Paciente</label>
                                    <select
                                        value={filters.patientId}
                                        onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                    >
                                        <option value="all">Todos os Pacientes</option>
                                        {patients.map(patient => (
                                            <option key={patient.id} value={patient.id}>{patient.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <Input
                                    label="Data Inicial"
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    containerClassName="flex-1"
                                />
                                <Input
                                    label="Data Final"
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    containerClassName="flex-1"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="taken">Tomadas</option>
                                    <option value="pending">Pendentes</option>
                                </select>
                            </div>

                            <Button onClick={generateReport} className="w-full">
                                <FileText size={18} className="mr-2" /> Gerar Relatório
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {reportData && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total</p>
                                            <p className="text-2xl font-bold text-blue-900">{reportData.summary.total}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Tomadas</p>
                                            <p className="text-2xl font-bold text-green-900">{reportData.summary.taken}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium">Pendentes</p>
                                            <p className="text-2xl font-bold text-orange-900">{reportData.summary.pending}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Adesão</p>
                                            <p className="text-2xl font-bold text-purple-900">{reportData.summary.adherenceRate}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-wrap gap-3 no-print">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer size={18} className="mr-2" /> Imprimir
                            </Button>
                            <Button variant="outline" onClick={handleDownloadPDF}>
                                <Download size={18} className="mr-2" /> Download PDF
                            </Button>
                            <Button variant="outline" onClick={handleWhatsApp}>
                                <MessageCircle size={18} className="mr-2" /> WhatsApp
                            </Button>
                            <Button variant="outline" onClick={handleEmail}>
                                <Mail size={18} className="mr-2" /> Email
                            </Button>
                        </div>

                        {paginatedItems.length > 0 ? (
                            <>
                                <div className="grid gap-3">
                                    {paginatedItems.map((item, idx) => (
                                        <Card key={idx} className={`${item.status === 'taken' ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.status === 'taken' ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                                                            {item.status === 'taken' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{item.medication}</p>
                                                            <p className="text-sm text-slate-600">{item.patient}</p>
                                                            <p className="text-xs text-slate-400">
                                                                {formatDate(item.date)} às {item.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.status === 'taken' ? 'Tomado' : 'Pendente'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">Nenhum item encontrado para os filtros selecionados.</p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                <Modal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    title="Enviar Relatório por Email"
                >
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Email do Destinatário"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={emailData.to}
                            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Observações (opcional)</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                                placeholder="Informações adicionais..."
                                rows={3}
                                value={emailData.observations}
                                onChange={(e) => setEmailData({ ...emailData, observations: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Button variant="ghost" onClick={() => setShowEmailModal(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleSendEmail} disabled={sendingEmail} className="flex-1">
                                {sendingEmail ? 'Enviando...' : 'Enviar Email'}
                            </Button>
                        </div>
                    </div>
                </Modal>


            </div>

            {/* Print Only View */}
            <div className="hidden print:block">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Relatório de Medicamentos</h1>
                    <p className="text-slate-600">
                        {(() => {
                            const [startYear, startMonth, startDay] = filters.startDate.split('-').map(Number);
                            const [endYear, endMonth, endDay] = filters.endDate.split('-').map(Number);
                            const start = new Date(startYear, startMonth - 1, startDay);
                            const end = new Date(endYear, endMonth - 1, endDay);
                            return `${formatDate(start)} até ${formatDate(end)}`;
                        })()}
                    </p>
                    {filters.patientId !== 'all' && (
                        <p className="text-slate-500 mt-1">
                            Paciente: {patients.find(p => p.id === filters.patientId)?.name}
                        </p>
                    )}
                    <p className="text-slate-500 mt-1">
                        Status: {filters.status === 'all' ? 'Todos' : filters.status === 'taken' ? 'Tomadas' : 'Pendentes'}
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Resumo</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg bg-slate-50">
                            <div className="text-sm text-slate-500">Total</div>
                            <div className="text-xl font-bold text-slate-900">{reportData?.summary.total}</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                            <div className="text-sm text-green-600">Tomadas</div>
                            <div className="text-xl font-bold text-green-900">{reportData?.summary.taken}</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-orange-50">
                            <div className="text-sm text-orange-600">Pendentes</div>
                            <div className="text-xl font-bold text-orange-900">{reportData?.summary.pending}</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-purple-50">
                            <div className="text-sm text-purple-600">Adesão</div>
                            <div className="text-xl font-bold text-purple-900">{reportData?.summary.adherenceRate}%</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-900">Detalhamento</h3>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Data/Hora</th>
                                <th className="px-4 py-3">Medicamento</th>
                                <th className="px-4 py-3">Paciente</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReportItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="font-medium text-slate-900">
                                            {(() => {
                                                const [year, month, day] = item.date.split('-').map(Number);
                                                const date = new Date(year, month - 1, day);
                                                return formatDate(date);
                                            })()}
                                        </div>
                                        <div className="text-xs">{item.time}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {item.medication}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.patient}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'taken'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.status === 'taken' ? 'TOMADO' : 'PENDENTE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 pt-8 border-t text-center text-slate-400 text-xs">
                    Gerado em {formatDateTime(new Date())}
                </div>
            </div>
        </>
    );
};

export default Reports;
