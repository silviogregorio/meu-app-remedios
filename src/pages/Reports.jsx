import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { FileText, Printer, Calendar, CheckCircle, Clock, Mail, MessageCircle, Download, Gift, Activity, Filter, ArrowRight } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState('history'); // 'history' | 'birthdays' | 'stock'

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
        setEmailType('report');
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
            let html, text, subject;

            if (emailType === 'birthday' && birthdayPatient) {
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
            } else {
                html = generateReportHtml();
                text = generateReportText(); // Fallback text
                subject = `Relatório de Medicamentos - ${formatDate(reportData?.filters?.startDate || new Date())}`;
            }

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: emailData.to,
                    subject: subject,
                    text: text,
                    html: html
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

                {/* Tabs Navigation */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 no-print">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'history'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        Histórico de Consumo
                        {activeTab === 'history' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('birthdays')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'birthdays'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        Aniversariantes
                        {activeTab === 'birthdays' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'stock'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        Movimentações
                        {activeTab === 'stock' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                </div>

                {activeTab === 'stock' && (
                    <div className="flex flex-col gap-6">
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
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Medicamento</label>
                                            <select
                                                value={filters.medicationId}
                                                onChange={(e) => setFilters({ ...filters, medicationId: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                            >
                                                <option value="all">Todos os Medicamentos</option>
                                                {medications.map(med => (
                                                    <option key={med.id} value={med.id}>{med.name} {med.dosage}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Paciente</label>
                                            <select
                                                value={filters.patientId}
                                                onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
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

                        {loadingStock ? (
                            <div className="py-12 text-center text-slate-500">Carregando movimentações...</div>
                        ) : stockData.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                                Nenhum registro encontrado para estes filtros.
                            </div>
                        ) : (
                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Data/Hora</th>
                                                <th className="px-6 py-4">Medicamento</th>
                                                <th className="px-6 py-4">Qtd.</th>
                                                <th className="px-6 py-4">Motivo</th>
                                                <th className="px-6 py-4">Paciente</th>
                                                <th className="px-6 py-4">Usuário</th>
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
                                                        <td className="px-6 py-4 text-slate-600">
                                                            {formatDateTime(item.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-900">
                                                            {item.medications?.name}
                                                            <div className="flex gap-1 text-xs text-slate-500 font-normal mt-0.5">
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
                                                        <td className="px-6 py-4 text-slate-600">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${item.reason === 'consumption' ? 'bg-orange-50 text-orange-700' :
                                                                item.reason === 'refill' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {reasonMap[item.reason] || item.reason}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">
                                                            {item.patients?.name || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                                            {item.profiles?.full_name || 'Usuário'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'history' ? (
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
                ) : (
                    <div className="flex flex-col gap-6">
                        <Card className="no-print">
                            <CardHeader>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Buscar Aniversariantes</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Selecione uma data para ver os aniversariantes do dia</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-semibold text-slate-700 ml-1 mb-1.5 block">Dia</label>
                                            <select
                                                value={selectedDay}
                                                onChange={(e) => setSelectedDay(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="text-sm font-semibold text-slate-700 ml-1 mb-1.5 block">Mês</label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
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
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center text-white">
                                                        <Gift size={24} />
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
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const msg = `Olá ${patient.name}, feliz aniversário! 🎂🎉🥳 Que seu dia seja iluminado e cheio de alegria! Desejamos muita saúde, paz e felicidades! ✨🎈`;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200"
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

                {activeTab === 'history' && reportData && (
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
                    title={emailType === 'birthday' ? "Enviar Cartão de Aniversário" : "Enviar Relatório por Email"}
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


            </div >

            {/* Print Only View */}
            < div className="hidden print:block" >
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
            </div >
        </>
    );
};

export default Reports;
