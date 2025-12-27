import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from 'lucide-react';

const ActivityChart = ({ data }) => {
    // data format: array of { date: 'YYYY-MM-DD', count: number }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dateStr = payload[0].payload.date;
            const fullDate = format(parseISO(dateStr), "d 'de' MMMM", { locale: ptBR });

            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="font-semibold text-slate-700 capitalize">{fullDate}</p>
                    <p className="text-sm text-slate-500">
                        {payload[0].value} doses tomadas
                    </p>
                </div>
            );
        }
        return null;
    };

    const hasActivity = data && data.length > 0 && data.some(item => item.count > 0);

    if (!hasActivity) {
        return (
            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-6 px-4 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <Activity size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium">Sem atividade registrada nesta semana</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] relative overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => format(parseISO(value), 'EEE', { locale: ptBR }).slice(0, 3)}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;
