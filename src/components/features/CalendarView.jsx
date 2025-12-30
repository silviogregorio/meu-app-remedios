import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalendarView = ({ prescriptions, consumptionLog, healthLogs = [], onDateSelect, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const days = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate, healthLogs, prescriptions, consumptionLog]);

    // Helper to Get Day Status
    const getDayStatus = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Check for Health Logs (Vital Signs)
        const hasLogs = healthLogs && healthLogs.some(log => log.measured_at.startsWith(dateStr));

        // 1. Find prescriptions active on this date
        const activePrescriptions = prescriptions.filter(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            // Ignore time components
            const d = new Date(dateStr + 'T00:00:00'); // Fix Timezone parsing for consistency
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            // Continuous use: only check start date
            if (p.continuousUse) {
                return d >= start;
            }
            return d >= start && d <= end;
        });

        if (activePrescriptions.length === 0) {
            // If no meds but has logs -> Logged (Blue)
            if (hasLogs) return 'logged';
            return 'empty';
        }

        // 2. Count Total Expected Doses
        // Simplified: matches 'times' array length
        let expectedDoses = 0;
        activePrescriptions.forEach(p => {
            // Basic frequency check (Daily assumed for simplicity if complex freq not parsed)
            // Ideally we check frequency (e.g. "Every 2 days"), but for MVP we assume daily sched if active.
            if (p.times && Array.isArray(p.times)) {
                expectedDoses += p.times.length;
            }
        });

        if (expectedDoses === 0) {
            if (hasLogs) return 'logged';
            return 'empty';
        }

        // 3. Count Taken Doses
        const takenCount = consumptionLog.filter(log =>
            log.date === dateStr && log.status === 'taken'
        ).length;

        if (takenCount >= expectedDoses) return 'full';
        if (takenCount === 0) {
            // Only Red if date is in the past or today (and time passed? simplified to past date)
            if (date < new Date().setHours(0, 0, 0, 0)) {
                // Even if missed meds, if has logs, maybe show partial/info? 
                // Sticking to strict adherence priority: Red if missed meds logic.
                // But maybe a small indicator modification? For now, let's prioritize adherence status.
                return 'missed';
            }
            if (hasLogs) return 'logged'; // Today/Future with logs but no meds taken yet (or no meds due yet if future)
            return 'pending'; // Future/Today pending
        }
        return 'partial';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-base text-slate-800 capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={handleToday} className="px-2 py-0.5 text-xs font-medium hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600">
                        Hoje
                    </button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-3">
                {/* Weekdays */}
                <div className="grid grid-cols-7 mb-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Padding for start of month */}
                    {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const status = getDayStatus(day);
                        const isSelected = selectedDate === dateStr;
                        const isCurrentDay = isToday(day);

                        let bgClass = "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100";
                        let statusIcon = null;

                        // Base Status Styles
                        if (status === 'full') {
                            bgClass = "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200";
                            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-1" />;
                        } else if (status === 'missed') {
                            bgClass = "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200";
                            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mx-auto mt-1" />;
                        } else if (status === 'partial') {
                            bgClass = "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200";
                            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mt-1" />;
                        } else if (status === 'logged') {
                            bgClass = "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200";
                            statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" />;
                        } else if (status === 'pending') {
                            bgClass = "bg-white hover:bg-slate-50 text-slate-400 border-slate-200 border-dashed";
                        }

                        // Today Highlight (Secondary)
                        if (isCurrentDay) {
                            // Use a lighter ring if not selected, or just bold text
                            bgClass += " ring-1 ring-primary ring-offset-1 font-bold";
                        }

                        // Selected Highlight (Primary - Overrides)
                        if (isSelected) {
                            bgClass = "bg-slate-800 text-white border-slate-800 shadow-lg scale-105 z-10 hover:bg-slate-700";
                            // Adjust icon for dark background
                            if (statusIcon) {
                                // Clone icon with white border or just keep it (dots usually visible on dark if colored brightly, but maybe need adjustment)
                                // Status dots are colored. Emerald on Slate-800 is visible.
                            }
                        }

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => onDateSelect(dateStr)}
                                className={`
                                    aspect-square rounded-lg border flex flex-col items-center justify-center transition-all relative
                                    ${bgClass}
                                `}
                            >
                                <span className="text-xs">{format(day, 'd')}</span>
                                {statusIcon}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3 py-2 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Tomado</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Registros</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Parcial</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Não Tomado</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
