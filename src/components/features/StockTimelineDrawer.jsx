import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Package, Calendar, User, ChevronRight, History, ArrowRight } from 'lucide-react';
import { StockService } from '../../services/stockService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

/**
 * Stock Timeline Drawer - Shows stock history with chart and list
 */
const StockTimelineDrawer = ({ medication, onClose }) => {
    const [history, setHistory] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, [medication.id]);

    const loadHistory = async () => {
        try {
            const data = await StockService.getStockHistory(medication.id, 30);
            setHistory(data);
            setChartData(StockService.prepareChartData(data));
        } catch (error) {
            console.error('Error loading stock history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReasonIcon = (reason) => {
        switch (reason) {
            case 'refill':
                return <TrendingUp size={16} className="text-green-500" />;
            case 'consumption':
                return <TrendingDown size={16} className="text-red-500" />;
            default:
                return <Package size={16} className="text-blue-500" />;
        }
    };

    const getReasonColor = (quantityChange) => {
        return quantityChange > 0 ? 'text-green-600' : 'text-red-600';
    };

    // Calculate chart dimensions
    const chartHeight = 120;
    const chartWidth = 280;
    const maxBalance = Math.max(...chartData.map(d => d.balance), 1);
    const minBalance = Math.min(...chartData.map(d => d.balance), 0);
    const range = maxBalance - minBalance || 1;

    // Generate SVG path for the chart
    const generatePath = () => {
        if (chartData.length < 2) return '';

        const points = chartData.map((d, i) => {
            const x = (i / (chartData.length - 1)) * chartWidth;
            const y = chartHeight - ((d.balance - minBalance) / range) * (chartHeight - 20);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    // Generate area path for gradient fill
    const generateAreaPath = () => {
        if (chartData.length < 2) return '';

        const points = chartData.map((d, i) => {
            const x = (i / (chartData.length - 1)) * chartWidth;
            const y = chartHeight - ((d.balance - minBalance) / range) * (chartHeight - 20);
            return `${x},${y}`;
        });

        return `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`;
    };

    const goToFullHistory = () => {
        onClose();
        navigate('/app/reports', { state: { activeTab: 'stock', medicationId: medication.id } });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <History size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Histórico de Estoque</h2>
                            <p className="text-blue-100 font-medium">{medication.name}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Mini Chart */}
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Últimos 30 dias
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        Saldo: {medication.quantity || 0}
                                    </span>
                                </div>

                                {chartData.length >= 2 ? (
                                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32">
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {/* Area fill */}
                                        <path
                                            d={generateAreaPath()}
                                            fill="url(#areaGradient)"
                                        />
                                        {/* Line */}
                                        <path
                                            d={generatePath()}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Dots */}
                                        {chartData.map((d, i) => {
                                            const x = (i / (chartData.length - 1)) * chartWidth;
                                            const y = chartHeight - ((d.balance - minBalance) / range) * (chartHeight - 20);
                                            return (
                                                <circle
                                                    key={i}
                                                    cx={x}
                                                    cy={y}
                                                    r="4"
                                                    fill="#3b82f6"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                />
                                            );
                                        })}
                                    </svg>
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                                        Sem dados suficientes para o gráfico
                                    </div>
                                )}
                            </div>

                            {/* Recent Movements */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={14} />
                                    Movimentações recentes
                                </h3>

                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma movimentação registrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {history.slice(-10).reverse().map((entry, idx) => (
                                            <div
                                                key={entry.id || idx}
                                                className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                                            >
                                                <div className="p-2 bg-slate-50 rounded-lg">
                                                    {getReasonIcon(entry.reason)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {StockService.translateReason(entry.reason)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {format(new Date(entry.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                        {entry.profiles?.full_name && (
                                                            <span className="ml-1">• {entry.profiles.full_name.split(' ')[0]}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${getReasonColor(entry.quantity_change)}`}>
                                                        {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        → {entry.new_balance}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <button
                        onClick={goToFullHistory}
                        className="w-full py-3 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        Ver histórico completo
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockTimelineDrawer;
