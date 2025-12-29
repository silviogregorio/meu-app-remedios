import React from 'react';
import Card, { CardContent } from '../ui/Card';
import { User, CheckCircle2, Clock, Users, AlertCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const FamilyDashboard = ({ patients, todaysSchedule, visible }) => {
    if (!visible || patients.length <= 1) return null;

    return (
        <Card className="mb-6 overflow-hidden border-slate-200/30 shadow-sm bg-white/70">
            {/* Header Compacto */}
            <div className="px-4 py-3 border-b border-slate-100/50 flex items-center gap-3 bg-slate-50/30">
                <Users size={18} className="text-blue-500 shrink-0" />
                <span className="text-base font-black text-slate-800 dark:text-white">Família</span>
                <span className="text-xs font-bold text-slate-400 ml-auto">{patients.length} pacientes</span>
            </div>

            <div className="divide-y divide-slate-100">
                {patients.map((patient, index) => {
                    const patientSchedule = todaysSchedule.filter(i => i.patientId === patient.id);
                    const total = patientSchedule.length;
                    const taken = patientSchedule.filter(i => i.isTaken).length;
                    const isAllTaken = total > 0 && total === taken;
                    const hasDoses = total > 0;
                    const isEven = index % 2 === 0;

                    return (
                        <div
                            key={patient.id}
                            className={clsx(
                                "p-5 transition-all duration-300",
                                isEven ? "bg-white/40" : "bg-slate-50/50"
                            )}
                        >
                            <div className="flex flex-col gap-3">
                                {/* Top Row: Status + Icon */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                            isAllTaken ? "bg-emerald-100 text-emerald-600" :
                                                hasDoses ? "bg-amber-100 text-amber-600" :
                                                    "bg-slate-100 text-slate-400"
                                        )}>
                                            {isAllTaken ? <CheckCircle2 size={16} /> : <User size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Status</span>
                                            <span className={clsx(
                                                "text-sm font-black leading-none",
                                                isAllTaken ? "text-emerald-600" :
                                                    hasDoses ? "text-amber-600" : "text-slate-400"
                                            )}>
                                                {isAllTaken ? 'Completo' : hasDoses ? 'Pendente' : 'Livre'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Doses Counter */}
                                    {hasDoses && (
                                        <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="font-black text-slate-700 text-sm">{taken}/{total}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Doses</span>
                                        </div>
                                    )}
                                </div>

                                {/* Patient Row */}
                                <div className="pl-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0 leading-none">Familiar</p>
                                    <p className="font-black text-slate-700 dark:text-slate-300 text-lg leading-tight break-words mt-0.5">
                                        {patient.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default FamilyDashboard;
