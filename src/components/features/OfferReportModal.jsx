import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, MessageCircle, Mail, Filter, BarChart3, TrendingUp, TrendingDown, Target, Eye, MousePointer2, MousePointerClick, ExternalLink, Calendar, X, Tag, CheckCircle2, Clock, AlertCircle, FileText, Share2 } from 'lucide-react';
import { generatePDFOfferReport } from '../../utils/pdfGenerator';
import { formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { getApiEndpoint } from '../../config/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { format } from 'date-fns';

const OfferReportModal = ({ sponsor, onClose }) => {
    const { showToast } = useApp();
    const [offers, setOffers] = useState([]);
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired, scheduled

    // Date Filtering
    const [period, setPeriod] = useState('30days'); // 7days, 30days, all, custom
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Email Sharing State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({ to: '', observations: '' });
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        const fetchOfferData = async () => {
            try {
                const { data, error } = await supabase
                    .from('ad_offers')
                    .select('*')
                    .eq('sponsor_id', sponsor.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                const fetchedOffers = data || [];
                setOffers(fetchedOffers);
                setFilteredOffers(fetchedOffers);
            } catch (err) {
                console.error('Error fetching report data:', err);
                showToast('Erro ao carregar dados do relatório', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOfferData();
    }, [sponsor.id]);

    useEffect(() => {
        const now = new Date();
        let filtered = [...offers];

        // 1. Filter by Date Period (created_at or active range)
        if (period !== 'all') {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            filtered = filtered.filter(o => {
                const created = new Date(o.created_at);
                // An offer is relevant if it was created before or during the period,
                // AND it hasn't expired before the period started (if it has an expiration).
                // But usually, date filters for reports of this type focus on creation or active window.
                // Let's focus on creation date for simplicity/clarity in "Analysis".
                return created >= start && created <= end;
            });
        }

        // 2. Filter by Status
        if (filterStatus === 'active') {
            filtered = filtered.filter(o => o.active && (!o.expires_at || new Date(o.expires_at) > now) && (!o.starts_at || new Date(o.starts_at) <= now));
        } else if (filterStatus === 'expired') {
            filtered = filtered.filter(o => !o.active || (o.expires_at && new Date(o.expires_at) < now));
        } else if (filterStatus === 'scheduled') {
            filtered = filtered.filter(o => o.active && o.starts_at && new Date(o.starts_at) > now);
        }

        setFilteredOffers(filtered);
    }, [filterStatus, offers, period, startDate, endDate]);

    const handlePeriodChange = (val) => {
        setPeriod(val);
        const today = new Date();
        if (val === '7days') {
            const d = new Date();
            d.setDate(today.getDate() - 7);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (val === '30days') {
            const d = new Date();
            d.setDate(today.getDate() - 30);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    };

    const calculateTotals = () => {
        const totalViews = filteredOffers.reduce((acc, o) => acc + (o.views_count || 0), 0);
        const totalClicks = filteredOffers.reduce((acc, o) => acc + (o.clicks_count || 0), 0);
        const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        return { totalViews, totalClicks, avgCtr };
    };

    const { totalViews, totalClicks, avgCtr } = calculateTotals();

    const getStatusLabel = (offer) => {
        const now = new Date();
        const start = offer.starts_at ? new Date(offer.starts_at) : null;
        const end = offer.expires_at ? new Date(offer.expires_at) : null;

        if (!offer.active) return { label: 'Inativa', color: 'text-slate-400 bg-slate-100', icon: <X size={14} />, id: 'inactive' };
        if (end && end < now) return { label: 'Expirada', color: 'text-red-600 bg-red-50', icon: <AlertCircle size={14} />, id: 'expired' };
        if (start && start > now) return { label: 'Agendada', color: 'text-blue-600 bg-blue-50', icon: <Clock size={14} />, id: 'scheduled' };
        return { label: 'Ativa', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={14} />, id: 'active' };
    };

    const handlePrint = async () => {
        try {
            const totals = calculateTotals();
            const doc = await generatePDFOfferReport(
                sponsor,
                filteredOffers,
                totals,
                { startDate, endDate, period }
            );

            // Generate filename: Relatorio_Ofertas_SponsorName_Date.pdf
            const fileName = `Relatorio_Ofertas_${sponsor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            // Fallback to browser print if PDF generator fails
            window.print();
        }
    };

    const generateSummaryText = () => {
        const formatD = (s) => new Date(s).toLocaleDateString('pt-BR');
        const rangeText = period === 'all' ? 'Tudo' : `${formatD(startDate)} a ${formatD(endDate)}`;

        // String.fromCodePoint for better cross-platform compatibility
        const emojiReport = String.fromCodePoint(0x1F4CA); // 📊
        const emojiCalendar = String.fromCodePoint(0x1F4C5);// 📅
        const emojiChart = String.fromCodePoint(0x1F4C8);  // 📈
        const emojiEye = String.fromCodePoint(0x1F441);    // 👁️
        const emojiCursor = String.fromCodePoint(0x1F5B1); // 🖱️
        const emojiTarget = String.fromCodePoint(0x1F3AF); // 🎯
        const emojiFire = String.fromCodePoint(0x1F525);   // 🔥
        const emojiMoney = String.fromCodePoint(0x1F4B0);  // 💰
        const emojiSearch = String.fromCodePoint(0x1F50D); // 🔍
        const emojiPointer = String.fromCodePoint(0x1F446);// 👆

        let text = `${emojiReport} *RELATÓRIO DE PERFORMANCE - ${sponsor.name}*\n`;
        text += `${emojiCalendar} Período: ${rangeText}\n\n`;
        text += `${emojiChart} *RESUMO GERAL:*\n`;
        text += `${emojiEye} Visualizações: ${totalViews}\n`;
        text += `${emojiCursor} Cliques: ${totalClicks}\n`;
        text += `${emojiTarget} Conversão (CTR): ${avgCtr.toFixed(1)}%\n\n`;
        text += `----------------------------------\n`;
        text += `${emojiFire} *TOP OFERTAS (No Período):*\n`;

        filteredOffers.slice(0, 5).forEach(o => {
            const ctr = o.views_count > 0 ? (o.clicks_count / o.views_count) * 100 : 0;
            text += `• *${o.title}*\n`;
            text += `  ${emojiMoney} Preço: ${formatCurrency(o.price)}\n`;
            text += `  ${emojiSearch} ${o.views_count} vis. | ${emojiPointer} ${o.clicks_count} cliques | ${emojiTarget} ${ctr.toFixed(1)}%\n\n`;
        });

        text += `\n*SiG Remédios*\n`;
        text += `_Acesse o painel completo:_\nhttps://sigremedios.vercel.app/app/sponsors\n\n`;
        text += `_Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}_`;
        return text;
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(generateSummaryText());
        const phone = sponsor.whatsapp ? sponsor.whatsapp.replace(/\D/g, '') : '';
        const url = phone ? `https://api.whatsapp.com/send?phone=55${phone}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
    };

    const handleEmailShare = () => {
        setEmailData({ to: sponsor.email || '', observations: '' });
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailData.to) {
            showToast('Por favor, informe o destinatário.', 'error');
            return;
        }

        setSendingEmail(true);
        const startTime = performance.now();
        try {
            const totals = calculateTotals();
            const formatD = (s) => new Date(s).toLocaleDateString('pt-BR');
            const rangeText = period === 'all' ? 'Completo' : `${formatD(startDate)} a ${formatD(endDate)}`;

            // 1. Generate PDF
            console.log('📄 [EMAIL] Starting PDF generation...');
            const pdfStart = performance.now();
            const doc = await generatePDFOfferReport(
                sponsor,
                filteredOffers,
                totals,
                { startDate, endDate, period }
            );
            console.log(`📄 [EMAIL] PDF generated in ${Math.round(performance.now() - pdfStart)}ms`);

            // 2. Prepare for API - use dataurlstring for base64
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const pdfSizeKB = Math.round(pdfBase64.length * 0.75 / 1024);
            console.log(`📄 [EMAIL] PDF size: ${pdfSizeKB} KB`);
            const fileName = `Relatorio_Ofertas_${sponsor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            const subject = `Relatório de Performance - ${sponsor.name} (${rangeText})`;
            const text = `Olá,\n\nSegue em anexo o relatório de performance das ofertas (PDF) para o período de ${rangeText}.\n\nAtenciosamente,\nEquipe SiG Remédios`;

            const payload = {
                to: emailData.to,
                subject: subject,
                text: text,
                observations: emailData.observations,
                type: 'ad_report',
                reportData: {
                    sponsorName: sponsor.name,
                    periodText: rangeText,
                    stats: {
                        views: totals.totalViews,
                        clicks: totals.totalClicks,
                        ctr: totals.avgCtr.toFixed(1),
                        offersCount: filteredOffers.length
                    }
                },
                attachments: [
                    {
                        filename: fileName,
                        content: pdfBase64,
                        encoding: 'base64'
                    }
                ]
            };

            console.log('Sending Email Payload:', { ...payload, attachments: 'PDF Content Masked' });

            // 3. Call API
            console.log('📤 [EMAIL] Sending to API...');
            const apiStart = performance.now();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(getApiEndpoint('/api/send-email'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload)
            });
            console.log(`📤 [EMAIL] API response in ${Math.round(performance.now() - apiStart)}ms`);

            if (!response.ok) throw new Error('Falha ao enviar e-mail');

            console.log(`✅ [EMAIL] Total time: ${Math.round(performance.now() - startTime)}ms`);
            showToast('E-mail enviado com sucesso!', 'success');
            setShowEmailModal(false);
        } catch (error) {
            console.error('Error sending email:', error);
            showToast('Erro ao enviar e-mail. Tente novamente.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm print:bg-white print:p-0 print:static print:block">
            {/* Estilos específicos para impressão */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        margin: 15mm 10mm 15mm 10mm;
                        size: A4 portrait;
                    }
                    body { 
                        margin: 0 !important; 
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Remove qualquer fundo escuro ou sombra que cause linhas verticais */
                    .fixed.inset-0 {
                        position: static !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    .bg-white.rounded-3xl {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-no-break {
                        break-inside: avoid;
                    }
                }
            ` }} />

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 print:h-auto print:static print:shadow-none print:w-full print:rounded-none print:max-w-none print:border-none print:block">

                {/* Header (UI) */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 relative print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 shrink-0">
                            <BarChart3 size={28} aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">Relatório de Performance</h2>
                            <p className="text-base text-slate-500 font-bold">{sponsor.name} • {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pr-10 md:pr-0">
                        <button
                            onClick={handleWhatsAppShare}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-xl transition-all font-black text-sm border border-green-200"
                            aria-label="Compartilhar via WhatsApp"
                        >
                            <MessageCircle size={18} /> <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                            onClick={handleEmailShare}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-black text-sm border border-blue-100"
                            aria-label="Enviar por E-mail"
                        >
                            <Mail size={18} /> <span className="hidden sm:inline">E-mail</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-black text-sm border border-slate-200"
                            aria-label="Imprimir relatório ou Salvar como PDF"
                        >
                            <Download size={18} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>

                    {/* Botão de Fechar Absoluto para evitar desalinhamento no mobile */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400 shrink-0"
                        aria-label="Fechar relatório"
                    >
                        <X size={28} />
                    </button>
                </div>


                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white print:p-0">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-lg text-slate-600 font-black animate-pulse">Compilando estatísticas...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 max-w-5xl mx-auto">

                            {/* Resumo Geral - Cards para idosos/leigos */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                                        <Eye size={24} />
                                    </div>
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Visualizações</p>
                                    <p className="text-4xl font-black text-slate-900">{totalViews}</p>
                                    <p className="text-xs text-slate-500 mt-1">Total de vezes exibido</p>
                                </div>
                                <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 mb-3 shadow-sm">
                                        <MousePointerClick size={24} />
                                    </div>
                                    <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Cliques</p>
                                    <p className="text-4xl font-black text-slate-900">{totalClicks}</p>
                                    <p className="text-xs text-slate-500 mt-1">Interessados na oferta</p>
                                </div>
                                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 mb-3 shadow-sm">
                                        <TrendingUp size={24} />
                                    </div>
                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Conversão (CTR)</p>
                                    <p className="text-4xl font-black text-slate-900">{avgCtr.toFixed(1)}%</p>
                                    <p className="text-xs text-slate-500 mt-1">Eficiência média</p>
                                </div>
                            </div>

                            {/* Filtros e Controles */}
                            <div className="flex flex-col gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 print:hidden">
                                {/* Linha 1: Período */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                        <Calendar size={18} className="text-slate-400 shrink-0" />
                                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest mr-2">Período:</span>
                                        {[
                                            { id: '7days', label: '7 Dias' },
                                            { id: '30days', label: '30 Dias' },
                                            { id: 'all', label: 'Tudo' },
                                            { id: 'custom', label: 'Personalizado' }
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handlePeriodChange(p.id)}
                                                className={`
                                                    px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2
                                                    ${period === p.id
                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                                        : 'border-white bg-white text-slate-500 hover:border-slate-200'
                                                    }
                                                `}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    {period === 'custom' && (
                                        <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in slide-in-from-right-2">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="flex-1 md:w-40 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none"
                                            />
                                            <span className="text-slate-400 font-bold">até</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="flex-1 md:w-40 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-slate-200 w-full opacity-50"></div>

                                {/* Linha 2: Status */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                        <Filter size={18} className="text-slate-400 shrink-0" />
                                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest mr-2">Status:</span>
                                        {[
                                            { id: 'all', label: 'Todas as Ofertas', color: 'bg-white' },
                                            { id: 'active', label: 'Ativas', color: 'bg-green-100 text-green-700' },
                                            { id: 'expired', label: 'Expiradas', color: 'bg-red-100 text-red-700' },
                                            { id: 'scheduled', label: 'Agendadas', color: 'bg-blue-100 text-blue-700' }
                                        ].map(btn => (
                                            <button
                                                key={btn.id}
                                                onClick={() => setFilterStatus(btn.id)}
                                                className={`
                                                    px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2
                                                    ${filterStatus === btn.id
                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                                        : 'border-white bg-white text-slate-500 hover:border-slate-200'
                                                    }
                                                `}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 hidden md:block">
                                        Exibindo {filteredOffers.length} {filteredOffers.length === 1 ? 'oferta' : 'ofertas'} no período
                                    </p>
                                </div>
                            </div>

                            {/* Tabela de Dados (Desktop) */}
                            <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm print:border-slate-300 print:rounded-none">
                                <div className="overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-left border-collapse table-auto">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase tracking-widest" scope="col">Oferta / Produto</th>
                                                <th className="px-4 py-5 text-sm font-black text-slate-500 uppercase tracking-widest text-center" scope="col">Preço</th>
                                                <th className="px-4 py-5 text-sm font-black text-slate-500 uppercase tracking-widest text-center" scope="col">Status</th>
                                                <th className="px-4 py-5 text-sm font-black text-slate-500 uppercase tracking-widest text-center" scope="col">Visual.</th>
                                                <th className="px-4 py-5 text-sm font-black text-slate-500 uppercase tracking-widest text-center" scope="col">Cliques</th>
                                                <th className="px-6 py-5 text-sm font-black text-slate-500 uppercase tracking-widest text-center" scope="col">CTR</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredOffers.map(offer => {
                                                const status = getStatusLabel(offer);
                                                const discount = offer.original_price ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100) : 0;
                                                const ctr = offer.views_count > 0 ? (offer.clicks_count / offer.views_count) * 100 : 0;

                                                return (
                                                    <tr key={offer.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                                    <Tag className="w-5 h-5 text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-900 text-base leading-tight">{offer.title}</p>
                                                                    <p className="text-xs text-slate-400 font-bold">Criado em: {new Date(offer.created_at).toLocaleDateString('pt-BR')}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <p className="font-black text-green-600 text-base leading-none">{formatCurrency(offer.price)}</p>
                                                                {offer.original_price && (
                                                                    <p className="text-xs text-slate-400 line-through font-bold">{formatCurrency(offer.original_price)}</p>
                                                                )}
                                                                {discount > 0 && (
                                                                    <span className="mt-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black border border-red-100 uppercase italic">
                                                                        -{discount}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center">
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${status.color} border border-current/10`}>
                                                                {status.icon}
                                                                {status.label}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center font-black text-slate-700 text-lg">
                                                            {offer.views_count || 0}
                                                        </td>
                                                        <td className="px-4 py-5 text-center font-black text-blue-600 text-lg">
                                                            {offer.clicks_count || 0}
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className={`text-base font-black px-3 py-1 rounded-lg ${ctr > 5 ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                                                                {ctr.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile/Tablet Card View */}
                            <div className="lg:hidden space-y-4 print:hidden">
                                {filteredOffers.map(offer => {
                                    const status = getStatusLabel(offer);
                                    const ctr = offer.views_count > 0 ? (offer.clicks_count / offer.views_count) * 100 : 0;
                                    const discount = offer.original_price ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100) : 0;

                                    return (
                                        <div key={offer.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-black text-slate-900 break-words pr-4">{offer.title}</h4>
                                                    <p className="text-sm text-slate-500 font-bold mt-1">Desde: {new Date(offer.created_at).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Atual</p>
                                                    <p className="text-2xl font-black text-green-600">{formatCurrency(offer.price)}</p>
                                                    {discount > 0 && (
                                                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-black border border-red-100 uppercase italic">-{discount}% OFF</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversão</p>
                                                    <p className="text-2xl font-black text-purple-600">{ctr.toFixed(1)}%</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-4">
                                                <div className="text-center pr-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visualizações</p>
                                                    <p className="text-2xl font-black text-slate-800">{offer.views_count || 0}</p>
                                                </div>
                                                <div className="text-center pl-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cliques</p>
                                                    <p className="text-2xl font-black text-blue-600">{offer.clicks_count || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredOffers.length === 0 && (
                                <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                                        <AlertCircle size={32} />
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-base">Nenhuma oferta encontrada neste filtro</p>
                                    <button
                                        onClick={() => setFilterStatus('all')}
                                        className="mt-4 text-blue-600 font-black text-sm hover:underline"
                                    >
                                        Limpar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal de Email Profissional */}
                <Modal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    title="Enviar Relatório por E-mail"
                >
                    <div className="flex flex-col gap-4">
                        <Input
                            label="E-mail do Destinatário"
                            type="text"
                            placeholder="exemplo@email.com, outro@email.com"
                            value={emailData.to}
                            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 -mt-3 mb-2 ml-1">
                            Separe múltiplos e-mails com vírgula (,)
                        </p>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Observações (opcional)</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                                placeholder="Uma breve observação para o parceiro..."
                                rows={3}
                                value={emailData.observations}
                                onChange={(e) => setEmailData({ ...emailData, observations: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowEmailModal(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleSendEmail} disabled={sendingEmail} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {sendingEmail ? 'Enviando...' : 'Enviar Agora'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OfferReportModal;
