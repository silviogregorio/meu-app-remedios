import React from 'react';
import Card, { CardContent } from '../ui/Card';
import { User, CheckCircle2, Clock, Users, AlertCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const FamilyDashboard = ({ patients, todaysSchedule, visible }) => {
    if (!visible || patients.length <= 1) return null;

    // Calculate overall family progress
    const totalDoses = todaysSchedule.length;
    const takenDoses = todaysSchedule.filter(i => i.isTaken).length;
    const overallProgress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    return (
        <Card className="mb-6 overflow-hidden border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white via-white to-slate-50/80">
            {/* Premium Header with Gradient */}
            <div className="relative px-5 py-4 border-b border-slate-100/80 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-violet-50/50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%)]"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <Users size={18} className="text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black text-slate-800 dark:text-white">Família</span>
                            <p className="text-[10px] font-medium text-slate-400 -mt-0.5">{patients.length} membros ativos</p>
                        </div>
                    </div>

                    {/* Overall Progress Badge */}
                    <div className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5",
                        overallProgress === 100
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                    )}>
                        {overallProgress === 100 ? <Sparkles size={12} className="animate-pulse" /> : <Clock size={12} />}
                        {overallProgress}% hoje
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {patients.map((patient, index) => {
                    const patientSchedule = todaysSchedule.filter(i => i.patientId === patient.id);
                    const total = patientSchedule.length;
                    const taken = patientSchedule.filter(i => i.isTaken).length;
                    const progress = total > 0 ? Math.round((taken / total) * 100) : 100;
                    const isAllTaken = total > 0 && total === taken;
                    const hasDoses = total > 0;

                    return (
                        <div
                            key={patient.id}
                            className="relative p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Patient Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* Status Dot */}
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full shrink-0",
                                            isAllTaken ? "bg-emerald-500" :
                                                hasDoses ? "bg-amber-500" : "bg-slate-300"
                                        )} />
                                        <h4 className="font-bold text-slate-800 text-base truncate">
                                            {patient.name}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 ml-4">
                                        <span className={clsx(
                                            "text-xs font-semibold",
                                            isAllTaken ? "text-emerald-600" :
                                                hasDoses ? "text-amber-600" : "text-slate-400"
                                        )}>
                                            {isAllTaken ? '✓ Completo' : hasDoses ? 'Pendente' : 'Livre hoje'}
                                        </span>
                                        {hasDoses && (
                                            <span className="text-[10px] text-slate-400">
                                                • {taken}/{total} doses
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Badge */}
                                {hasDoses && (
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-full font-bold text-sm shrink-0",
                                        isAllTaken
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "bg-amber-100 text-amber-600"
                                    )}>
                                        {progress}%
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {hasDoses && (
                                <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all duration-700 ease-out",
                                            isAllTaken
                                                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                : "bg-gradient-to-r from-amber-400 to-orange-400"
                                        )}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default FamilyDashboard;
