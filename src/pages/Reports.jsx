import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { FileText, Printer, Calendar, CheckCircle, Clock, Timer, Mail, MessageCircle, Download, Gift, Activity, Filter, ArrowRight, PieChart, Eye, Share2, History, ClipboardList } from 'lucide-react';
import AdherenceChart from '../components/analytics/AdherenceChart';
import ActivityChart from '../components/analytics/ActivityChart';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generatePDFReport, generatePDFStockReport } from '../utils/pdfGenerator';
import { getApiEndpoint } from '../config/api';
import { formatDateTime, formatDate, getISODate, parseISODate } from '../utils/dateFormatter';
import {
    generateReportText,
    generateReportHtml,
    generateStockReportText,
    generateStockReportHtml
} from '../utils/reportGenerators';


const ITEMS_PER_PAGE = 6;

const Reports = () => {
    const { patients, medications, prescriptions, consumptionLog, showToast } = useApp();

    const getDefaultDates = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        const year = thirtyDaysAgo.getFullYear();
        const month = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
        const day = String(thirtyDaysAgo.getDate()).padStart(2, '0');
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

    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history' | 'birthdays' | 'stock'

    // Default to today
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const [birthdayData, setBirthdayData] = useState([]);

    const [filters, setFilters] = useState({
        patientId: 'all',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
        status: 'all',
        medicationId: 'all' // New Filter
    });

    const [stockData, setStockData] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);

    const [reportData, setReportData] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        to: '',
        observations: ''
    });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [emailType, setEmailType] = useState('report'); // 'report' | 'birthday'
    const [birthdayPatient, setBirthdayPatient] = useState(null);

    const openBirthdayEmailModal = (patient) => {
        setBirthdayPatient(patient);
        setEmailType('birthday');
        setEmailData({ to: patient.email || '', observations: '' });
        setShowEmailModal(true);
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filters.status, activeTab, selectedDay, selectedMonth]);

    // Lógica de Aniversariantes
    React.useEffect(() => {
        if (activeTab === 'birthdays') {
            const birthdays = patients.filter(patient => {
                if (!patient.birthDate) return false;
                const [pYear, pMonth, pDay] = patient.birthDate.split('-').map(Number);
                // Compara apenas Mês e Dia
                return pMonth === selectedMonth && pDay === selectedDay;
            }).map(patient => {
                const birth = new Date(patient.birthDate);
                const today = new Date(); // Usar a data selecionada ou hoje para calcular idade? Geralmente hoje.

                // Cálculo detalhado da idade
                let years = today.getFullYear() - birth.getFullYear();
                let months = today.getMonth() - birth.getMonth();
                let days = today.getDate() - birth.getDate();

                if (days < 0) {
                    months--;
                    // Dias do mês anterior
                    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    days += lastMonth.getDate();
                }

                if (months < 0) {
                    years--;
                    months += 12;
                }

                const parts = [];
                if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
                if (months > 0) parts.push(`${months} mês${months > 1 ? 'es' : ''}`);
                if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);

                const detailedAge = parts.length > 0 ? parts.join(', ') : 'Hoje!';

                return {
                    ...patient,
                    age: years,
                    detailedAge
                };
            });
            setBirthdayData(birthdays);
        }
    }, [activeTab, selectedDay, selectedMonth, patients]);

    // Fetch Stock History
    React.useEffect(() => {
        if (activeTab === 'stock') {
            fetchStockHistory();
        }
    }, [activeTab, filters.startDate, filters.endDate, filters.patientId, filters.medicationId]);

    const fetchStockHistory = async () => {
        if (!filters.startDate || !filters.endDate) return;

        setLoadingStock(true);
        try {
            let query = supabase
                .from('stock_history')
                .select(`
                    *,
                    medications:medication_id (name, dosage, type),
                    patients:patient_id (name),
                    profiles:user_id (full_name)
                `)
                .gte('created_at', `${filters.startDate}T00:00:00`)
                .lte('created_at', `${filters.endDate}T23:59:59`)
                .order('created_at', { ascending: false });

            if (filters.patientId !== 'all') {
                query = query.eq('patient_id', filters.patientId);
            }
            if (filters.medicationId !== 'all') {
                query = query.eq('medication_id', filters.medicationId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setStockData(data || []);

        } catch (error) {
            console.error('Error fetching stock history:', error);
            showToast('Erro ao buscar histórico de estoque', 'error');
        } finally {
            setLoadingStock(false);
        }
    };

    // Calculate Dashboard Metrics
    const getDashboardData = () => {
        // 1. Adherence Rate (Taken vs Pending for selected period)
        let totalDoses = 0;
        let takenDoses = 0;

        // Calculate expected doses based on prescriptions inside the period
        prescriptions.forEach(p => {
            // Simplified calculation for dashboard overview (last 30 days usually, but using filters here)
            const pStart = new Date(p.startDate);
            const pEnd = new Date(p.endDate);
            const fStart = new Date(filters.startDate);
            const fEnd = new Date(filters.endDate);

            if (pEnd < fStart || pStart > fEnd) return; // No overlap

            // Quick approximation for total expected in filtering window
            // For precision we would iterate days like in report, but for dashboard let's be efficient
            // checking consumptionLog is faster source of truth for "taken"
            // counting pending is harder without iterating.
            // Strategy: Count actual Taken from log VS Estimated total derived from schedule.
        });

        // Better Report Data Strategy: Reuse generateReport logic if possible or simplified version
        // Let's use the consumptionLog directly for "Activity" and "Adherence" based on logs vs active prescriptions.

        // Activity Data (Last 7 days relative to EndDate)
        const activityData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(filters.endDate);
            d.setDate(d.getDate() - i);
            const dateStr = getISODate(d);

            const count = consumptionLog.filter(log => log.date === dateStr).length;
            activityData.push({ date: dateStr, count });
        }

        // Adherence Data (Summary)
        // We can reuse the "reportData" if it exists, otherwise we calculate a quick snapshot
        // If reportData is null, we might show empty state or trigger calculation?
        // Let's rely on reportData which is calculated when generating report, OR calculate on fly.

        // Triggering calculation on mount/filter change for dashboard is better.
        // Let's duplicate the core loop of generateReport but optimized, or just use consumptionLog stats.

        const takenCount = consumptionLog.filter(log =>
            log.date >= filters.startDate && log.date <= filters.endDate
        ).length;

        // Estimated total needed? 
        // For simplicity in this version 1.0, let's show "Taken" vs "Missed" based on generated report data if available,
        // or just show "Taken" count trends which is reliable.

        return {
            activity: activityData,
            adherence: reportData?.summary ? {
                taken: reportData.summary.taken,
                pending: reportData.summary.pending,
                total: reportData.summary.total
            } : { taken: 0, pending: 0, total: 0 }
        };
    };

    const dashboardData = getDashboardData();

    // Ensure report data is calculated when in dashboard tab to populate pie chart
    React.useEffect(() => {
        if (activeTab === 'dashboard') {
            generateReport();
        }
    }, [activeTab, filters.startDate, filters.endDate, filters.patientId]); // Removed itemsPerPage which was undefined

    const generateReport = () => {
        if (!filters.startDate || !filters.endDate) {
            return;
        }

        // Validate dates to prevent RangeError during manual typing
        const fCheckStart = new Date(filters.startDate);
        const fCheckEnd = new Date(filters.endDate);
        if (isNaN(fCheckStart.getTime()) || isNaN(fCheckEnd.getTime())) {
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
            const prescStart = parseISODate(prescription.startDate);
            const prescEnd = prescription.endDate ? parseISODate(prescription.endDate) : null;
            const filterStart = parseISODate(filters.startDate);
            const filterEnd = parseISODate(filters.endDate);

            const start = new Date(Math.max(prescStart, filterStart));
            const end = prescEnd ? new Date(Math.min(prescEnd, filterEnd)) : filterEnd;

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Frequency Check - treat undefined/null as 'daily' (default)
                let isDue = false;
                const freq = prescription.frequency || 'daily';

                if (freq === 'daily') {
                    isDue = true;
                } else if (freq === 'specific_days') {
                    const weekMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
                    const dayStr = weekMap[d.getDay()];
                    if (prescription.weekDays && prescription.weekDays.includes(dayStr)) isDue = true;
                } else if (freq === 'interval') {
                    const diffDays = Math.floor((d - prescStart) / (1000 * 60 * 60 * 24));
                    if (prescription.intervalDays && diffDays % prescription.intervalDays === 0) isDue = true;
                } else {
                    // Unknown frequency type, treat as daily
                    isDue = true;
                }

                if (isDue) {
                    prescription.times.forEach(time => {
                        expectedDoses.push({
                            date: getISODate(d),
                            time: time,
                            patientId: prescription.patientId,
                            medicationId: prescription.medicationId,
                            prescriptionId: prescription.id
                        });
                    });
                }
            }
        });

        const reportItems = expectedDoses.map(dose => {
            const patient = patients.find(p => p.id === dose.patientId);
            const medication = medications.find(m => m.id === dose.medicationId);

            const taken = consumptionLog.find(log => {
                const match = (log.prescriptionId === dose.prescriptionId || log.prescription_id === dose.prescriptionId) &&
                    (log.date === dose.date || (log.taken_at && log.taken_at.startsWith(dose.date))) &&
                    (log.scheduledTime === dose.time || log.scheduled_time === dose.time);
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

    const handlePrint = async () => {
        try {
            let doc;
            if (activeTab === 'stock') {
                doc = await generatePDFStockReport(stockData, filters, patients);
            } else {
                doc = await generatePDFReport(reportData, filters, patients);
            }
            // AutoPrint logic
            doc.autoPrint();
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            window.open(url);
        } catch (error) {
            console.error('Erro ao gerar PDF para impressão:', error);
            showToast('Erro ao preparar impressão', 'error');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            let doc;
            let theme = 'geral';
            if (activeTab === 'stock') {
                doc = await generatePDFStockReport(stockData, filters, patients);
                theme = 'estoque';
            } else {
                doc = await generatePDFReport(reportData, filters, patients);
            }
            const filename = `relatorio-${theme}-sig-remedios-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`;
            doc.save(filename);
            showToast('PDF salvo com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showToast('Erro ao gerar PDF', 'error');
        }
    };

    const handleViewPDF = async () => {
        try {
            let doc;
            if (activeTab === 'stock') {
                doc = await generatePDFStockReport(stockData, filters, patients);
            } else {
                doc = await generatePDFReport(reportData, filters, patients);
            }
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Erro ao visualizar PDF:', error);
            showToast('Erro ao abrir visualização', 'error');
        }
    };

    // generateReportText foi movido para utils/reportGenerators.js
    // Uso: generateReportText(reportData, filters, patients)


    // generateReportHtml foi movido para utils/reportGenerators.js
    // Uso: generateReportHtml(reportData, filters, patients, emailData)

    // generateStockReportText foi movido para utils/reportGenerators.js
    // Uso: generateStockReportText(stockData, filters, patients, medications)

    // generateStockReportHtml foi movido para utils/reportGenerators.js
    // Uso: generateStockReportHtml(stockData, filters)

    const handleWhatsApp = () => {
        // Ensure report data is calculated for accurate summary
        generateReport();

        const patientName = filters.patientId !== 'all'
            ? patients.find(p => p.id === filters.patientId)?.name || 'Todos'
            : 'Todos os Pacientes';

        // Get fresh stats after generateReport runs (though setState is async, we can approximate)
        // If we want it perfectly sync, we'd need to return the summary from generateReport.
        // For now, let's use the current reportData or a fallback.
        const stats = reportData?.summary || { adherenceRate: 0, taken: 0, pending: 0 };

        const summaryText = `*RESUMO DE SAÚDE*\n*Paciente:* ${patientName}\n*Adesão:* ${stats.adherenceRate}%\n*Tomados:* ${stats.taken}\n*Pendentes:* ${stats.pending}`;

        let finalText = '';

        if (activeTab === 'stock') {
            const stockText = generateStockReportText(stockData, filters, patients, medications).replace('\n---\n_Gerado via SiG Remédios - Sistema de Controle de Medicamentos_\nhttps://sigremedios.vercel.app', '');
            finalText = `${stockText}\n\n${summaryText}\n\n---\n_Gerado via SiG Remédios - Sistema de Controle de Medicamentos_\nhttps://sigremedios.vercel.app`;
        } else {
            finalText = `*RELATÓRIO DE SAÚDE - SIMPLIFICADO*\n\n*Paciente:* ${patientName}\n*Período:* ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}\n\n*Adesão:* ${stats.adherenceRate}%\n*Tomadas:* ${stats.taken}\n*Pendentes:* ${stats.pending}\n\n---\n_Gerado via SiG Remédios - Sistema de Controle de Medicamentos_\nhttps://sigremedios.vercel.app`;
        }

        window.open(`https://wa.me/?text=${encodeURIComponent(finalText)}`, '_blank');
    };

    const handleEmail = (type) => { // Updated to accept type override
        setEmailType(type || (activeTab === 'stock' ? 'stock' : 'report'));
        setEmailData({ to: '', observations: '' });
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Por favor, informe o email do destinatário', 'error');
            return;
        }

        setSendingEmail(true);

        try {
            let html, text, subject, attachments;

            if (emailType === 'birthday' && birthdayPatient) {
                // Birthday Email Logic (Unchanged)
                subject = `Feliz Aniversário, ${birthdayPatient.name}! 🎉`;
                text = `Parabéns ${birthdayPatient.name}! Desejamos muitas felicidades.`;
                html = `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0fdfa;">
                        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #ccfbf1;">
                            
                            <!-- Header com Gradiente da Marca -->
                            <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 40px 20px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Feliz Aniversário! 🎂</h1>
                                <p style="font-size: 24px; margin-top: 8px; font-weight: 500; opacity: 0.95;">${birthdayPatient.name}</p>
                            </div>
                            
                            <div style="padding: 40px 30px; text-align: center;">
                                <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
                                    Hoje é um dia muito especial! 🎉<br>
                                    Desejamos que seu novo ciclo seja repleto de <strong>saúde</strong>, <strong>paz</strong> e <strong>alegria</strong>.
                                </p>
                                
                                <!-- Imagem Festiva (Logo do App - Garantia Total) -->
                                <div style="margin: 30px 0; background-color: #f0fdfa; border-radius: 50%; width: 200px; height: 200px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px;">
                                    <a href="https://sigremedios.vercel.app/" target="_blank">
                                        <img src="https://sigremedios.vercel.app/pwa-512x512.png" alt="Feliz Aniversário" style="width: 100%; height: 100%; object-fit: contain;" />
                                    </a>
                                </div>

                                <p style="font-size: 16px; color: #64748b; font-style: italic;">
                                    "Celebre a vida e todos os momentos bons!" ✨
                                </p>
                            </div>

                            <!-- Footer com Logo e Link -->
                            <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #0f766e; font-weight: 700; margin: 0 0 10px 0; font-size: 16px;">Com carinho, Equipe SiG Remédios ❤️</p>
                                
                                ${emailData.observations ? `<p style="margin-bottom: 20px; color: #64748b; font-size: 14px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">${emailData.observations}</p><br>` : ''}

                                <div style="margin-top: 20px;">
                                    <span style="color: #94a3b8; font-size: 12px;">Cuide da sua saúde com facilidade.</span>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
            } else if (emailType === 'stock') {
                // Stock Report logic (could also be updated to PDF later if implemented)
                html = generateStockReportHtml(stockData, filters);
                text = generateStockReportText(stockData, filters, patients, medications);
                subject = `Relatório de Movimentações - ${formatDate(new Date())}`;
            } else {
                // MAIN REPORT logic - Now uses PDF Attachment
                const doc = await generatePDFReport(reportData, filters, patients);
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                const filename = `relatorio-${format(new Date(), 'dd-MM')}.pdf`;

                subject = `Relatório de Medicamentos - ${formatDate(reportData?.filters?.startDate || new Date())}`;
                text = `Olá,\n\nSegue em anexo o relatório de medicamentos (PDF) com a visualização completa e padronizada.`;

                // Use a simple HTML wrapper
                html = `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>Relatório de Medicamentos</h2>
                        <p>Olá,</p>
                        <p>Seu relatório completo foi gerado e está <strong>em anexo</strong> neste email.</p>
                        <p>O arquivo PDF contém o layout oficial com todos os detalhes.</p>
                        <br/>
                        <p>Atenciosamente,<br/>Equipe SiG Remédios</p>
                    </div>
                 `;

                attachments = [
                    {
                        filename: filename,
                        content: pdfBase64,
                        encoding: 'base64'
                    }
                ];
            }

            // call VERCEL API with Auth
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(getApiEndpoint('/api/send-email'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    to: emailData.to,
                    subject: subject,
                    text: text,
                    observations: emailData.observations,
                    type: (emailType === 'birthday') ? 'contact' : 'report',
                    reportData: (typeof reportPayload !== 'undefined') ? reportPayload : null,
                    attachments: attachments
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao enviar email');
            }

            showToast('Email enviado com sucesso!', 'success');
            setShowEmailModal(false);
            setEmailData({ to: '', observations: '' });
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            showToast(error.message || 'Erro ao enviar email.', 'error');
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

                {/* Tabs Navigation - Premium Segmented Control */}
                <div className="bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-3xl no-print overflow-hidden">
                    <div className="flex flex-wrap md:grid md:grid-cols-4 gap-1.5">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-1 min-w-[140px] md:min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'dashboard'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <PieChart size={18} className="shrink-0" />
                            <span className="whitespace-nowrap">Visão Geral</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 min-w-[100px] md:min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'history'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <History size={18} className="shrink-0" />
                            <span className="whitespace-nowrap">Histórico</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('birthdays')}
                            className={`flex-1 min-w-[120px] md:min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'birthdays'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <Gift size={18} className="shrink-0" />
                            <span className="whitespace-nowrap">Aniversários</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex-1 min-w-[80px] md:min-w-0 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'stock'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <ClipboardList size={18} className="shrink-0" />
                            <span className="whitespace-nowrap">Estoque</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'stock' && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-700 text-sm no-print leading-snug">
                            Gerencie seu estoque: acompanhe entradas, saídas e saiba o momento exato de repor.
                        </div>
                        <Card className="no-print">
                            <CardHeader>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Filtros de Estoque</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Visualize a movimentação de entrada e saída.</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-6">
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
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <label className="text-sm font-semibold text-slate-700">Medicamento</label>
                                            <select
                                                value={filters.medicationId}
                                                onChange={(e) => setFilters({ ...filters, medicationId: e.target.value })}
                                                className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                            >
                                                <option value="all">Todos os Medicamentos</option>
                                                {medications.map(med => (
                                                    <option key={med.id} value={med.id}>{med.name} {med.dosage}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <label className="text-sm font-semibold text-slate-700">Paciente</label>
                                            <select
                                                value={filters.patientId}
                                                onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                                                className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                            >
                                                <option value="all">Todos os Pacientes</option>
                                                {patients.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Button onClick={fetchStockHistory} variant="outline" className="w-full">
                                        <Filter size={18} className="mr-2" /> Atualizar Filtros
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {stockData.length > 0 && (
                            <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 no-print mb-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                    >
                                        <Printer size={16} className="mr-2 shrink-0" /> Imprimir
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadPDF}
                                        className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                    >
                                        <Download size={16} className="mr-2 shrink-0" /> Baixar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleViewPDF}
                                        className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                    >
                                        <Eye size={16} className="mr-2 shrink-0" /> Visualizar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleWhatsApp}
                                        className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                    >
                                        <MessageCircle size={16} className="mr-2 shrink-0" /> WhatsApp
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleEmail('stock')}
                                        className="w-full md:w-auto col-span-2 sm:col-span-1 border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs sm:text-sm h-11 rounded-2xl shadow-sm bg-white dark:bg-slate-700"
                                    >
                                        <Mail size={16} className="mr-2 shrink-0" /> Email
                                    </Button>
                                </div>
                            </div>
                        )}

                        {loadingStock ? (
                            <div className="py-12 text-center text-slate-500">Carregando movimentações...</div>
                        ) : stockData.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                                Nenhum registro encontrado para estes filtros.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Mobile View: Cards */}
                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {stockData.map((item) => {
                                        const isPositive = item.quantity_change > 0;
                                        const reasonMap = {
                                            'consumption': 'Consumo',
                                            'refill': 'Compra/Entrada',
                                            'adjustment': 'Ajuste Manual',
                                            'correction': 'Correção'
                                        };
                                        return (
                                            <Card key={item.id} className="overflow-hidden border-l-4 transition-all active:scale-[0.98]" style={{ borderLeftColor: isPositive ? '#16a34a' : '#ea580c' }}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                {formatDateTime(item.created_at)}
                                                            </p>
                                                            <h4 className="font-bold text-slate-900 leading-tight">
                                                                {item.medications?.name}
                                                            </h4>
                                                            <div className="flex gap-1 text-[11px] text-slate-500 mt-0.5">
                                                                <span>{item.medications?.dosage}</span>
                                                                {item.medications?.type && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{item.medications?.type}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`text-lg font-black shrink-0 ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                                                            {isPositive ? '+' : ''}{item.quantity_change}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo</p>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${item.reason === 'consumption' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                                item.reason === 'refill' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                                                }`}>
                                                                {reasonMap[item.reason] || item.reason}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Paciente</p>
                                                            <p className="text-xs font-medium text-slate-700 truncate">{item.patients?.name || '-'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                                                        <span className="font-bold">Realizado por:</span>
                                                        <span className="truncate">{item.profiles?.full_name || 'Usuário'}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block">
                                    <Card className="overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 whitespace-nowrap">Data/Hora</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">Medicamento</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">Qtd.</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">Motivo</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">Paciente</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">Usuário</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {stockData.map((item) => {
                                                        const isPositive = item.quantity_change > 0;
                                                        const reasonMap = {
                                                            'consumption': 'Consumo',
                                                            'refill': 'Compra/Entrada',
                                                            'adjustment': 'Ajuste Manual',
                                                            'correction': 'Correção'
                                                        };
                                                        return (
                                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                                                                    {formatDateTime(item.created_at)}
                                                                </td>
                                                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                                                    {item.medications?.name}
                                                                    <div className="flex gap-1 text-[10px] text-slate-500 font-normal mt-0.5">
                                                                        <span>{item.medications?.dosage}</span>
                                                                        {item.medications?.type && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span>{item.medications?.type}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className={`px-6 py-4 font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                                                                    {isPositive ? '+' : ''}{item.quantity_change}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600 text-xs">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${item.reason === 'consumption' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                                        item.reason === 'refill' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-100'
                                                                        }`}>
                                                                        {reasonMap[item.reason] || item.reason}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                                                                    {item.patients?.name || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 text-[10px] whitespace-nowrap italic">
                                                                    {item.profiles?.full_name || 'Usuário'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'dashboard' && reportData && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm no-print leading-snug">
                            Acompanhe seu progresso em um só lugar. Visualize taxas de adesão e atividade semanal com gráficos dinâmicos.
                        </div>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="p-3 sm:p-5">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
                                                <FileText size={14} />
                                            </div>
                                            <p className="text-[11px] sm:text-sm text-blue-600 font-bold uppercase tracking-tight">Total</p>
                                        </div>
                                        <div className="pl-9 sm:pl-0">
                                            <p className="text-2xl font-black text-blue-900">{reportData.summary.total}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <CardContent className="p-3 sm:p-5">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md shadow-green-200 shrink-0">
                                                <CheckCircle size={14} />
                                            </div>
                                            <p className="text-[11px] sm:text-sm text-green-600 font-bold uppercase tracking-tight">Tomadas</p>
                                        </div>
                                        <div className="pl-9 sm:pl-0">
                                            <p className="text-2xl font-black text-green-900">{reportData.summary.taken}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                                <CardContent className="p-3 sm:p-5">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-200 shrink-0">
                                                <Timer size={14} />
                                            </div>
                                            <p className="text-[11px] sm:text-sm text-orange-600 font-bold uppercase tracking-tight">Pendentes</p>
                                        </div>
                                        <div className="pl-9 sm:pl-0">
                                            <p className="text-2xl font-black text-orange-900">{reportData.summary.pending}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                <CardContent className="p-3 sm:p-5">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-md shadow-purple-200 shrink-0">
                                                <Calendar size={14} />
                                            </div>
                                            <p className="text-[11px] sm:text-sm text-purple-600 font-bold uppercase tracking-tight">Adesão</p>
                                        </div>
                                        <div className="pl-9 sm:pl-0">
                                            <p className="text-2xl font-black text-purple-900">{reportData.summary.adherenceRate}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section - Improved Responsiveness */}
                        {/* Charts Section - Improved Responsiveness */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 print:break-inside-avoid">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                                    Taxa de Adesão
                                </h4>
                                <div className="flex-1">
                                    <AdherenceChart data={dashboardData.adherence} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                    Atividade Semanal
                                </h4>
                                <div className="flex-1">
                                    <ActivityChart data={dashboardData.activity} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-violet-700 text-sm no-print leading-snug">
                            Histórico de doses: filtre registros e gere relatórios detalhados para seu médico.
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
                                            <label className="text-sm font-semibold text-slate-700">Paciente</label>
                                            <select
                                                value={filters.patientId}
                                                onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                                                className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
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
                                        <label className="text-sm font-semibold text-slate-700">Status</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                            className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
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

                        {/* History Table Results */}
                        {reportData && (
                            <>
                                {/* Quick Actions Panel - Senior UI/UX Refinement */}
                                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 no-print mb-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={handlePrint}
                                            className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                        >
                                            <Printer size={16} className="mr-2 shrink-0" /> Imprimir
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleDownloadPDF}
                                            className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                        >
                                            <Download size={16} className="mr-2 shrink-0" /> Baixar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleViewPDF}
                                            className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                        >
                                            <Eye size={16} className="mr-2 shrink-0" /> Visualizar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleWhatsApp}
                                            className="w-full md:w-auto bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-xs sm:text-sm h-11 rounded-2xl shadow-sm"
                                        >
                                            <MessageCircle size={16} className="mr-2 shrink-0" /> WhatsApp
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleEmail}
                                            className="w-full md:w-auto col-span-2 sm:col-span-1 border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs sm:text-sm h-11 rounded-2xl shadow-sm bg-white dark:bg-slate-700"
                                        >
                                            <Mail size={16} className="mr-2 shrink-0" /> Email
                                        </Button>
                                    </div>
                                </div>

                                {paginatedItems.length > 0 ? (
                                    <>
                                        <div className="grid gap-3">
                                            {paginatedItems.map((item, idx) => (
                                                <Card key={idx} className={`${item.status === 'taken' ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.status === 'taken' ? 'bg-green-500 shadow-green-100' : 'bg-orange-500 shadow-orange-100'} text-white shadow-lg shrink-0`}>
                                                                    {item.status === 'taken' ? <CheckCircle size={18} /> : <Timer size={18} />}
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
                    </div>
                )}

                {activeTab === 'birthdays' && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-pink-700 text-sm no-print leading-snug">
                            Celebre a vida! Identifique aniversariantes e envie felicitações via WhatsApp ou E-mail com um toque.
                        </div>
                        <Card className="no-print overflow-visible">
                            <CardHeader>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Buscar Aniversariantes</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Selecione uma data para ver os aniversariantes do dia</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 flex gap-3">
                                        <div className="w-24 shrink-0">
                                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Dia</label>
                                            <select
                                                value={selectedDay}
                                                onChange={(e) => setSelectedDay(Number(e.target.value))}
                                                className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1 min-w-[170px]">
                                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Mês</label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                className="w-full h-12 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.4rem_center] bg-no-repeat"
                                            >
                                                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((month, idx) => (
                                                    <option key={idx} value={idx + 1}>{month}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const today = new Date();
                                            setSelectedDay(today.getDate());
                                            setSelectedMonth(today.getMonth() + 1);
                                        }}
                                        className="mb-0.5"
                                    >
                                        Hoje
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3">
                            {birthdayData.length > 0 ? (
                                birthdayData.map(patient => (
                                    <Card key={patient.id} className="border-pink-200 bg-pink-50/30">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-full bg-pink-500 shrink-0 flex items-center justify-center text-white">
                                                        <Gift size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{patient.name}</p>
                                                        <p className="text-sm text-slate-600">
                                                            {formatDate(patient.birthDate)} <span className="text-pink-500 font-medium">• {patient.detailedAge}</span>
                                                        </p>
                                                        {patient.phone && (
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <MessageCircle size={12} /> {patient.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const msg = `Olá ${patient.name}, feliz aniversário! 🎂🎉🥳 Que seu dia seja iluminado e cheio de alegria! Desejamos muita saúde, paz e felicidades! ✨🎈`;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200 flex-1 md:flex-none"
                                                    >
                                                        <MessageCircle size={16} className="mr-2" /> WhatsApp
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openBirthdayEmailModal(patient)}
                                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                                    >
                                                        <Mail size={16} className="mr-2" /> Email
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-500">Nenhum aniversariante encontrado nesta data.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}



                <Modal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    title={emailType === 'birthday' ? "Enviar Cartão de Aniversário" : "Enviar Relatório por Email"}
                >
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Para:"
                            type="text" // Changed to text to allow multiple comma-separated emails
                            placeholder="exemplo@email.com, outro@email.com"
                            value={emailData.to}
                            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 -mt-3 mb-2 ml-1">
                            Dica: Separe múltiplos emails com vírgula (,)
                        </p>
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


            </div >
            {/* Spacing for dropdowns */}
            <div className="h-64 no-print sm:hidden" />


        </>
    );
};

export default Reports;
