import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X, FileText, Download, TrendingUp,
    MousePointerClick, Eye, BarChart3,
    Calendar, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const OfferReportModal = ({ sponsor, onClose }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOfferData = async () => {
            try {
                const { data, error } = await supabase
                    .from('ad_offers')
                    .select('*')
                    .eq('sponsor_id', sponsor.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOffers(data || []);
            } catch (err) {
                console.error('Error fetching report data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOfferData();
    }, [sponsor.id]);

    const calculateTotals = () => {
        const totalViews = offers.reduce((acc, o) => acc + (o.views_count || 0), 0);
        const totalClicks = offers.reduce((acc, o) => acc + (o.clicks_count || 0), 0);
        const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        return { totalViews, totalClicks, avgCtr };
    };

    const { totalViews, totalClicks, avgCtr } = calculateTotals();

    const getStatusLabel = (offer) => {
        const now = new Date();
        const start = offer.starts_at ? new Date(offer.starts_at) : null;
        const end = offer.expires_at ? new Date(offer.expires_at) : null;

        if (!offer.active) return { label: 'Inativa', color: 'text-slate-400 bg-slate-100', icon: <X size={12} /> };
        if (end && end < now) return { label: 'Expirada', color: 'text-red-600 bg-red-50', icon: <AlertCircle size={12} /> };
        if (start && start > now) return { label: 'Agendada', color: 'text-blue-600 bg-blue-50', icon: <Clock size={12} /> };
        return { label: 'Ativa', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={12} /> };
    };

    const handlePrint = () => {
        window.print();
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
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Relatório de Performance</h2>
                            <p className="text-sm text-slate-500 font-medium">{sponsor.name} • {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-200 rounded-xl transition-all font-bold text-slate-600 text-sm"
                        >
                            <Download size={18} /> Imprimir / PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                            <X size={24} />
                        </button>
                    </div>
                </div>


                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white print:p-0">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold animate-pulse">Compilando dados...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 max-w-5xl mx-auto">

                            {/* Tabela de Dados */}
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm print:border-slate-300">
                                <div className="overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-left border-collapse table-auto">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Oferta / Produto</th>
                                                <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Preço</th>
                                                <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Desc. %</th>
                                                <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Visu.</th>
                                                <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Cliques</th>
                                                <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">CTR</th>
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {offers.map(offer => {
                                                const status = getStatusLabel(offer);
                                                const discount = offer.original_price ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100) : 0;
                                                const ctr = offer.views_count > 0 ? (offer.clicks_count / offer.views_count) * 100 : 0;

                                                return (
                                                    <tr key={offer.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-xs leading-tight">{offer.title}</p>
                                                                <p className="text-[9px] text-slate-400 font-medium">Desde: {new Date(offer.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <p className="font-bold text-green-600 text-xs">{formatCurrency(offer.price)}</p>
                                                            {offer.original_price && (
                                                                <p className="text-[9px] text-slate-400 line-through">{formatCurrency(offer.original_price)}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            {discount > 0 ? (
                                                                <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-red-100 italic print:bg-transparent print:border-transparent">
                                                                    {discount}% DESC.
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-bold text-slate-600 text-[11px]">
                                                            {offer.views_count || 0}
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-bold text-blue-600 text-[11px]">
                                                            {offer.clicks_count || 0}
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={`text-[11px] font-black ${ctr > 5 ? 'text-purple-600' : 'text-slate-700'}`}>
                                                                {ctr.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status.color} border border-current/10`}>
                                                                {status.label}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {offers.length === 0 && (
                                    <div className="py-20 text-center">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhuma oferta cadastrada</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferReportModal;
