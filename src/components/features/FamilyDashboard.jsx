import React from 'react';
import Card, { CardContent } from '../ui/Card';
import { User, CheckCircle2, Clock, Users } from 'lucide-react';

const FamilyDashboard = ({ patients, todaysSchedule, visible }) => {
    if (!visible || patients.length <= 1) return null;

    // Se houver pacientes, mas nenhuma dose agendada para eles hoje, não mostrar o card específico?
    // Ou mostrar que não há doses agendadas.

    return (
        <div className="flex flex-col gap-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={24} className="text-blue-600" />
                    Visão Geral da Família
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map(patient => {
                    const patientSchedule = todaysSchedule.filter(i => i.patientId === patient.id);
                    const total = patientSchedule.length;
                    const taken = patientSchedule.filter(i => i.isTaken).length;
                    const isAllTaken = total > 0 && total === taken;
                    const hasDoses = total > 0;

                    return (
                        <Card key={patient.id} className="border-none shadow-sm hover:shadow-md transition-all group active:scale-95">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl transition-colors duration-300 ${!hasDoses ? 'bg-slate-100 text-slate-400' :
                                            isAllTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-blue-600 transition-colors">
                                            {patient.name}
                                        </p>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {hasDoses ? `${taken} de ${total} doses tomadas` : 'Nenhuma dose hoje'}
                                        </p>
                                    </div>
                                </div>
                                {hasDoses && (
                                    isAllTaken ? (
                                        <div className="bg-emerald-50 p-2 rounded-full">
                                            <CheckCircle2 size={24} className="text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                            <Clock size={14} />
                                            <span>Pendente</span>
                                        </div>
                                    )
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
