import { format, subDays, isSameDay, startOfDay } from 'date-fns';

/**
 * Health Vital Thresholds based on AHA, SBC, ADA, and WHO guidelines
 */
export const VITAL_THRESHOLDS = {
    pressure: {
        get: (sys, dia) => {
            // Check for extremely low values (Physiological impossibility or measurement error)
            if (sys < 50 || dia < 30) return { status: 'Valor Inválido/Erro', level: 'critical', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };

            // Critical Highs first
            if (sys > 180 || dia > 120) return { status: 'Crise Hipertensiva', level: 'critical', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };

            // Pressure Categorization (Broad/SBC compatible)
            if (sys >= 140 || dia >= 90) return { status: 'Hipertensão G2', level: 'high', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
            if (sys >= 130 || dia >= 85) return { status: 'Hipertensão G1', level: 'warn', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
            if (sys > 120 && dia < 80) return { status: 'Elevada', level: 'info', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };

            // Hypotension (Low Pressure)
            if (sys < 90 || dia < 60) return { status: 'Hipotensão', level: 'critical', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };

            // Normal Range
            return { status: 'Normal', level: 'normal', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
    },
    glucose: {
        get: (val) => {
            if (val >= 126) return { status: 'Alto', level: 'high', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
            if (val >= 100) return { status: 'Elevado', level: 'warn', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
            if (val < 70) return { status: 'Baixo', level: 'critical', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
            return { status: 'Normal', level: 'normal', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
    },
    oxygen: {
        get: (val) => {
            if (val < 90) return { status: 'Crítico', level: 'critical', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
            if (val < 95) return { status: 'Baixa', level: 'warn', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
            return { status: 'Normal', level: 'normal', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
    },
    heart: {
        get: (val) => {
            if (val > 100) return { status: 'Taquicardia', level: 'high', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
            if (val < 60) return { status: 'Bradicardia', level: 'warn', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
            return { status: 'Normal', level: 'normal', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
    },
    weight: {
        get: (val) => {
            return { status: null, level: 'info', color: 'text-slate-500', bg: 'bg-transparent', border: 'border-transparent' };
        }
    },
    temperature: {
        get: (val) => {
            if (val >= 39) return { status: 'Febre Alta', level: 'critical', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
            if (val >= 38) return { status: 'Febre', level: 'high', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
            if (val >= 37.3) return { status: 'Febril', level: 'warn', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
            if (val < 35.5) return { status: 'Hipotermia', level: 'critical', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
            return { status: 'Normal', level: 'normal', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
    }
};

/**
 * Returns the status and color for any vital metric
 */
export const getVitalStatus = (category, value, valueSecondary) => {
    const val = Number(value);
    const val2 = Number(valueSecondary);
    if (isNaN(val)) return null;

    if (category === 'pressure') return VITAL_THRESHOLDS.pressure.get(val, val2);
    if (category === 'glucose') return VITAL_THRESHOLDS.glucose.get(val);
    if (category === 'oxygen') return VITAL_THRESHOLDS.oxygen.get(val);
    if (category === 'heart' || category === 'pulse' || category === 'batimentos' || category === 'heart_rate') return VITAL_THRESHOLDS.heart.get(val);
    if (category === 'weight' || category === 'peso') return VITAL_THRESHOLDS.weight.get(val);
    if (category === 'temperature' || category === 'temperatura') return VITAL_THRESHOLDS.temperature.get(val);

    return { status: null, level: 'info', color: 'text-slate-500', bg: 'bg-transparent', border: 'border-transparent' };
};

/**
 * Groups health logs by day and calculates averages for a specific category
 */
export const groupLogsByDay = (logs, category, days = 14) => {
    if (!logs || logs.length === 0) return [];

    const result = [];
    const today = new Date();
    const dailyData = new Map();

    const filteredLogs = logs.filter(log => log.category === category);

    filteredLogs.forEach(log => {
        const dateKey = format(new Date(log.measured_at || log.created_at), 'yyyy-MM-dd');
        if (!dailyData.has(dateKey)) dailyData.set(dateKey, []);
        dailyData.get(dateKey).push(log);
    });

    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayLogs = dailyData.get(dateKey) || [];

        if (dayLogs.length > 0) {
            const avgValue = dayLogs.reduce((acc, curr) => {
                const val = parseFloat(String(curr.value).replace(',', '.'));
                return acc + (isNaN(val) ? 0 : val);
            }, 0) / dayLogs.length;
            const item = {
                date: format(date, 'dd/MM'),
                fullDate: dateKey,
                value: Math.round(avgValue * 10) / 10
            };

            if (category === 'pressure') {
                const avgSecondary = dayLogs.reduce((acc, curr) => acc + Number(curr.value_secondary || 0), 0) / dayLogs.length;
                item.value_secondary = Math.round(avgSecondary * 10) / 10;
            }
            result.push(item);
        } else {
            result.push({
                date: format(date, 'dd/MM'),
                fullDate: dateKey,
                value: null,
                value_secondary: category === 'pressure' ? null : undefined
            });
        }
    }
    return result;
};

/**
 * Analyzes the trend of the last logs combined with clinical risk
 */
export const getTrendInsight = (chartData, category) => {
    const validData = chartData.filter(d => d.value !== null);
    if (validData.length === 0) return { status: 'Sem Dados', message: 'Continue registrando para ver tendências.', color: 'text-slate-400' };

    const lastEntry = validData[validData.length - 1];
    const statusInfo = getVitalStatus(category, lastEntry.value, lastEntry.value_secondary);

    // If level is critical or high, focus on the warning regardless of trend
    if (statusInfo.level === 'critical' || statusInfo.level === 'high') {
        return {
            ...statusInfo,
            message: `Atenção: Seu último registro indica um nível ${statusInfo.status.toLowerCase()}.`
        };
    }

    if (validData.length < 2) return { ...statusInfo, message: 'Primeiros dados registrados. Continue acompanhando.' };

    const last = lastEntry.value;
    const prev = validData[validData.length - 2].value;
    const diff = last - prev;
    const percentChange = (diff / prev) * 100;

    if (Math.abs(percentChange) < 3) {
        return {
            ...statusInfo,
            message: 'Seus níveis estão estáveis e dentro de um padrão controlado.'
        };
    } else if (diff > 0) {
        return {
            ...statusInfo,
            message: 'Houve um leve aumento nos últimos registros. Observe se continua subindo.'
        };
    } else {
        return {
            ...statusInfo,
            message: 'Seus níveis apresentaram uma redução positiva. Continue assim!'
        };
    }
};

/**
 * Formats value for display
 */
export const formatHealthValue = (item, category) => {
    if (!item) return '--';

    // Robust parsing for strings that might contain units or use commas
    const parseValue = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return NaN;
        return parseFloat(String(val).replace(',', '.'));
    };

    const val = parseValue(item.value);
    const valSec = parseValue(item.value_secondary);

    if (isNaN(val)) return '--';

    if (category === 'pressure') {
        return `${Math.round(val)}/${Math.round(valSec || 0)}`;
    }
    if (category === 'temperature' || category === 'temperatura' || category === 'weight' || category === 'peso') {
        return val.toFixed(1);
    }
    return Math.round(val);
};
/**
 * Advanced Insights Analysis
 * Detects patterns like "Weekend Spikes", "Nightly Highs", or "Stability".
 */
export const analyzeHealthTrends = (logs, category) => {
    if (!logs || logs.length < 5) return []; // Need minimum data

    const insights = [];
    const categoryLogs = logs.filter(l => l.category === category).sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));

    if (categoryLogs.length < 5) return [];

    // 1. Weekend Effect (Check if values are higher on Sat/Sun)
    const weekendLogs = categoryLogs.filter(l => {
        const day = new Date(l.measured_at).getDay();
        return day === 0 || day === 6; // Sun or Sat
    });
    const weekdayLogs = categoryLogs.filter(l => {
        const day = new Date(l.measured_at).getDay();
        return day > 0 && day < 6;
    });

    if (weekendLogs.length > 2 && weekdayLogs.length > 2) {
        const getAvg = (arr) => arr.reduce((acc, curr) => acc + Number(curr.value), 0) / arr.length;
        const weekendAvg = getAvg(weekendLogs);
        const weekdayAvg = getAvg(weekdayLogs);

        // If weekend is > 10% higher than weekday
        if (weekendAvg > weekdayAvg * 1.1) {
            insights.push({
                type: 'warning',
                title: 'Padrão de Fim de Semana',
                description: 'Seus níveis tendem a subir aos sábados e domingos. Cuidado com exageros nestes dias.',
                icon: 'Calendar'
            });
        }
    }

    // 2. Time of Day Analysis (Morning vs Night)
    const morningLogs = categoryLogs.filter(l => {
        const hour = new Date(l.measured_at).getHours();
        return hour >= 6 && hour < 12;
    });
    const nightLogs = categoryLogs.filter(l => {
        const hour = new Date(l.measured_at).getHours();
        return hour >= 18 && hour <= 23;
    });

    if (morningLogs.length > 2 && nightLogs.length > 2) {
        const getAvg = (arr) => arr.reduce((acc, curr) => acc + Number(curr.value), 0) / arr.length;
        const morningAvg = getAvg(morningLogs);
        const nightAvg = getAvg(nightLogs);

        if (nightAvg > morningAvg * 1.15) {
            insights.push({
                type: 'info',
                title: 'Oscilação Noturna',
                description: 'Seus valores costumam ser mais altos à noite. Verifique se o cansaço do dia está influenciando.',
                icon: 'Moon'
            });
        }
    }

    // 3. Consistency/Engagement Reward
    const last7Days = categoryLogs.filter(l => {
        const sevenDaysAgo = subDays(new Date(), 7);
        return new Date(l.measured_at) >= sevenDaysAgo;
    });

    if (last7Days.length >= 5) {
        insights.push({
            type: 'success',
            title: 'Disciplina Exemplar',
            description: `Você registrou ${last7Days.length} medições na última semana. Manter esse histórico ajuda muito seu médico!`,
            icon: 'Award'
        });
    }

    // 4. Stability Check (Low Standard Deviation)
    // Only if we haven't found a major negative trend already
    if (insights.length === 0 && categoryLogs.length > 5) {
        const values = categoryLogs.map(l => Number(l.value));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Coefficient of variation < 10% is usually very stable
        if ((stdDev / avg) < 0.10) {
            insights.push({
                type: 'success',
                title: 'Estabilidade Total',
                description: 'Seus índices estão muito constantes, sem grandes picos ou quedas. Ótimo sinal de controle.',
                icon: 'Activity'
            });
        }
    }

    return insights;
};
