import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const AdherenceChart = ({ data }) => {
    // data format: { taken: number, pending: number, total: number }

    // Transform simple numbers into array format for Recharts
    const chartData = [
        { name: 'Tomados', value: data.taken, color: '#22c55e' }, // green-500
        { name: 'Pendentes/Perdidos', value: data.pending, color: '#f97316' }, // orange-500
    ].filter(item => item.value > 0);

    const hasData = data.total > 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="font-semibold text-slate-700">{payload[0].name}</p>
                    <p className="text-sm text-slate-500">
                        {payload[0].value} doses ({((payload[0].value / data.total) * 100).toFixed(1)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!hasData) {
        return (
            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-6 px-4 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <PieChartIcon size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium">Sem dados suficientes para gerar o gráfico</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend - Improved Spacing */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                        <span className="text-sm text-slate-400 font-normal">{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Inner Percentage - Senior UI Touch */}
            <div className="absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-2xl font-black text-slate-900 leading-none">
                    {((data.taken / data.total) * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Adesão</p>
            </div>
        </div>
    );
};

export default AdherenceChart;
