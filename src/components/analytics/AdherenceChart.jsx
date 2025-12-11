import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
            <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Sem dados suficientes para gerar o gráfico
            </div>
        );
    }

    return (
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdherenceChart;
