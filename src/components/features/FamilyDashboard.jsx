import React from 'react';
import Card, { CardContent } from '../ui/Card';
import { User, CheckCircle2, Clock, Users, AlertCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const FamilyDashboard = ({ patients, todaysSchedule, visible }) => {
    if (!visible || patients.length <= 1) return null;

    return (
        <div className="flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header com gradiente */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 px-4 py-3 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                        <Users size={18} className="text-white" />
                    </div>
                    Visão Geral da Família
                </h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {patients.length} pacientes
                </span>
            </div>

            {/* Grid de Cards dos Pacientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map(patient => {
                    const patientSchedule = todaysSchedule.filter(i => i.patientId === patient.id);
                    const total = patientSchedule.length;
                    const taken = patientSchedule.filter(i => i.isTaken).length;
                    const pending = total - taken;
                    const isAllTaken = total > 0 && total === taken;
                    const hasDoses = total > 0;
                    const progress = total > 0 ? (taken / total) * 100 : 0;

                    // Determinar cores baseadas no status
                    const statusConfig = !hasDoses
                        ? { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-400', badge: 'bg-slate-100 text-slate-500' }
                        : isAllTaken
                            ? { bg: 'bg-gradient-to-br from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'bg-emerald-500 text-white', badge: 'bg-emerald-100 text-emerald-700' }
                            : { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-200', icon: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-700' };

                    return (
                        <Card
                            key={patient.id}
                            className={clsx(
                                "border overflow-hidden hover:shadow-md transition-all duration-300",
                                statusConfig.bg,
                                statusConfig.border
                            )}
                        >
                            <CardContent className="p-3">
                                {/* Linha 1: Ícone + Nome do Paciente */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={clsx(
                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                        statusConfig.icon
                                    )}>
                                        <User size={14} />
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                        {patient.name}
                                    </p>
                                </div>

                                {/* Linha 2: Info + Badge */}
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        {hasDoses ? (
                                            <>
                                                <Clock size={10} />
                                                {total} dose{total !== 1 ? 's' : ''} hoje
                                            </>
                                        ) : (
                                            'Sem doses agendadas'
                                        )}
                                    </p>

                                    {/* Badge de Status */}
                                    {hasDoses && (
                                        <div className={clsx(
                                            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                            statusConfig.badge
                                        )}>
                                            {isAllTaken ? (
                                                <>
                                                    <Sparkles size={10} />
                                                    <span>OK</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={10} />
                                                    <span>{pending}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Barra de Progresso */}
                                {hasDoses && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-medium text-slate-600">Progresso</span>
                                            <span className="font-bold text-slate-700">{taken}/{total}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "h-full rounded-full transition-all duration-500 ease-out",
                                                    isAllTaken
                                                        ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                                        : "bg-gradient-to-r from-amber-400 to-orange-500"
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Estado sem doses */}
                                {!hasDoses && (
                                    <div className="mt-2 flex items-center gap-2 text-slate-400">
                                        <CheckCircle2 size={16} />
                                        <span className="text-xs">Nenhuma medicação para hoje</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default FamilyDashboard;
