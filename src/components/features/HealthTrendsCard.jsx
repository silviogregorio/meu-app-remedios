import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Info, Calendar, HeartPulse, Droplets, Scale, Thermometer, Heart, Wind } from 'lucide-react';
import { groupLogsByDay, getTrendInsight, formatHealthValue, getVitalStatus } from '../../utils/healthAnalytics';
import Card, { CardContent } from '../ui/Card';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const HealthTrendsCard = ({ logs, className }) => {
    const [activeCategory, setActiveCategory] = useState('pressure'); // 'pressure' | 'glucose' | 'weight' | 'temperature' | 'heart'

    const chartData = useMemo(() => {
        return groupLogsByDay(logs, activeCategory, 14); // 14 days lookback
    }, [logs, activeCategory]);

    const lastLiteralEntry = useMemo(() => {
        if (!logs || logs.length === 0) return null;
        const filtered = logs.filter(l => l.category === activeCategory);
        if (filtered.length === 0) return null;

        // Sort by date to be sure we get the latest
        const sorted = [...filtered].sort((a, b) => new Date(b.measured_at || b.created_at) - new Date(a.measured_at || b.created_at));
        return {
            value: sorted[0].value,
            value_secondary: sorted[0].value_secondary,
            date: sorted[0].measured_at || sorted[0].created_at
        };
    }, [logs, activeCategory]);

    const insight = useMemo(() => {
        const trendData = getTrendInsight(chartData, activeCategory);
        const literalStatus = lastLiteralEntry
            ? getVitalStatus(activeCategory, lastLiteralEntry.value, lastLiteralEntry.value_secondary)
            : null;

        // Always prioritize the literal last entry's status for the UI labels
        if (literalStatus) {
            return {
                ...trendData,
                ...literalStatus,
                message: (literalStatus.level === 'critical' || literalStatus.level === 'high')
                    ? `Atenção: Seu último registro indica um nível ${literalStatus.status.toLowerCase()}.`
                    : trendData.message
            };
        }
        return trendData;
    }, [chartData, activeCategory, lastLiteralEntry]);

    // If no logs at all, show invite to start tracking
    const hasAnyLogs = logs && logs.length > 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-200 shadow-xl rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <p className="text-sm font-black text-slate-800">
                                {entry.value} <span className="text-[10px] text-slate-400 font-medium">
                                    {activeCategory === 'pressure' ? 'mmHg' :
                                        activeCategory === 'glucose' ? 'mg/dL' :
                                            activeCategory === 'weight' ? 'kg' :
                                                activeCategory === 'temperature' ? '°C' : 'bpm'}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CustomLegend = () => {
        return (
            <div className="flex items-center justify-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-bold text-slate-600">Máxima (Sistólica)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-600">Mínima (Diastólica)</span>
                </div>
            </div>
        );
    };

    return (
        <Card className={clsx("overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm", className)}>
            <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white leading-tight">Tendências de Saúde</h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Últimos 14 dias</p>
                        </div>
                    </div>
                </div>

                {/* Legend & Stats - Prominent and Clear */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Último Registro</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {formatHealthValue(lastLiteralEntry, activeCategory)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {activeCategory === 'pressure' ? 'mmHg' :
                                    activeCategory === 'glucose' ? 'mg/dL' :
                                        activeCategory === 'weight' ? 'kg' :
                                            activeCategory === 'temperature' ? '°C' :
                                                activeCategory === 'oxygen' ? '%' : 'bpm'}
                            </span>
                        </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estado de Saúde</p>
                        <div className={clsx("font-black text-xs leading-tight uppercase tracking-tight", insight.color)}>
                            {insight.status || '--'}
                        </div>
                    </div>
                </div>

                {/* Category Grid - Compact and Intuitive */}
                <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {[
                        { id: 'pressure', label: 'Pressão', icon: HeartPulse },
                        { id: 'glucose', label: 'Glicemia', icon: Droplets },
                        { id: 'weight', label: 'Peso', icon: Scale },
                        { id: 'temperature', label: 'Temp.', icon: Thermometer },
                        { id: 'heart_rate', label: 'Freq.', icon: Heart },
                        { id: 'oxygen', label: 'Sat.', icon: Wind }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={clsx(
                                "flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all gap-1",
                                activeCategory === cat.id
                                    ? "bg-primary text-white border-primary shadow-sm scale-[1.02]"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            <cat.icon size={16} className={activeCategory === cat.id ? 'text-white' : 'text-slate-400'} />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>


            <CardContent className="p-4 min-h-[280px]">
                {(!hasAnyLogs || chartData.filter(d => d.value !== null).length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 text-center px-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                            <Calendar size={32} className="opacity-40 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Nenhum registro encontrado</p>
                            <p className="text-[10px] font-medium max-w-[200px] mt-1">
                                Adicione medições no Diário de Saúde para visualizar seus gráficos de tendência.
                            </p>
                        </div>
                    </div>
                ) : chartData.filter(d => d.value !== null).length < 3 ? (
                    // Show recent logs list for sparse data (< 3 different days)
                    <div className="h-full flex flex-col gap-4 py-4">
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Últimos Registros</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Adicione registros em mais dias para ver o gráfico de tendência</p>
                        </div>
                        <div className="space-y-2">
                            {logs
                                .filter(l => l.category === activeCategory)
                                .sort((a, b) => new Date(b.measured_at || b.created_at) - new Date(a.measured_at || a.created_at))
                                .slice(0, 5)
                                .map((log, idx) => {
                                    const status = getVitalStatus(activeCategory, log.value, log.value_secondary);
                                    return (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                            <div className="text-[10px] text-slate-500 font-medium shrink-0">
                                                {format(new Date(log.measured_at || log.created_at), 'dd/MM HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                {activeCategory === 'pressure' ? (
                                                    <>
                                                        <span className="text-base font-black text-blue-600">{Math.round(log.value)}</span>
                                                        <span className="text-xs text-slate-400">/</span>
                                                        <span className="text-base font-black text-emerald-600">{Math.round(log.value_secondary)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-base font-black text-blue-600">{formatHealthValue(log, activeCategory)}</span>
                                                )}
                                            </div>
                                            {status.status && (
                                                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${status.level === 'normal' ? 'bg-green-100 text-green-700' :
                                                    status.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {status.status}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ) : (
                    // Show line chart for data with 3+ days
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={50}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="100%">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    {activeCategory === 'pressure' && (
                                        <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="100%">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    )}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    hide={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    domain={['auto', 'auto']}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVal)"
                                    connectNulls
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />

                                {activeCategory === 'pressure' && (
                                    <Area
                                        type="monotone"
                                        dataKey="value_secondary"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        connectNulls={true}
                                        fillOpacity={1}
                                        fill="url(#colorSec)"
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                )}


                                {/* Guideline for Glucose (Example 100 fasting / 140 after meal) */}
                                {activeCategory === 'glucose' && (
                                    <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Alvo', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
                                )}

                                {/* Legend for pressure */}
                                {activeCategory === 'pressure' && (
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        content={<CustomLegend />}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-primary" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {insight.message}
                    </p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {activeCategory === 'pressure' ? 'Valores em mmHg' :
                        activeCategory === 'glucose' ? 'Valores em mg/dL' :
                            activeCategory === 'weight' ? 'Valores em kg' :
                                activeCategory === 'temperature' ? 'Valores em °C' :
                                    activeCategory === 'oxygen' ? 'Valores em %' : 'Valores em bpm'}
                </p>
            </div>
        </Card>
    );
};

export default HealthTrendsCard;
