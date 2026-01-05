import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuditService } from '../services/AuditService';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/layout/Header';
import { Shield, Eye, Edit, Trash, Download, Clock, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import Shimmer from '../components/ui/Shimmer';

const Activity = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

const ACTION_ICONS = {
    'VIEW': Eye,
    'EDIT': Edit,
    'DELETE': Trash,
    'EXPORT': Download,
    'default': Activity
};

const ACTION_COLORS = {
    'VIEW': 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    'EDIT': 'text-amber-500 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    'DELETE': 'text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    'EXPORT': 'text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    'default': 'text-gray-500 bg-gray-100'
};

const SecurityAudit = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadLogs();
        }
    }, [user]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const loadLogs = async () => {
        try {
            // Promise.allSettled ensures minimum 1s loading time regardless of fetch success/failure
            const [logsResult] = await Promise.allSettled([
                AuditService.getLogs(user.id),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            if (logsResult.status === 'fulfilled') {
                setLogs(logsResult.value);
            } else {
                console.error('Failed to load logs', logsResult.reason);
                // Optionally show error toast here
            }
        } catch (error) {
            console.error('Unexpected error loading logs', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateSmart = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return format(date, 'HH:mm');
        return format(date, 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Segurança e Auditoria" />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                        {loading ? (
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-4 w-full md:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Shimmer className="w-10 h-10 rounded-xl bg-white/40" />
                                        <Shimmer className="h-8 w-64 rounded-lg bg-white/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <Shimmer className="h-4 w-full md:w-96 rounded bg-white/30" />
                                        <Shimmer className="h-4 w-3/4 rounded bg-white/30" />
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/20 min-w-[200px]">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <Shimmer className="w-6 h-6 rounded bg-white/50" />
                                    </div>
                                    <div className="flex-1">
                                        <Shimmer className="h-3 w-20 rounded bg-white/40 mb-2" />
                                        <Shimmer className="h-6 w-32 rounded bg-white/50" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                                        <Shield className="w-8 h-8" /> Auditoria de Acessos
                                    </h2>
                                    <p className="text-emerald-50 max-w-lg text-lg">
                                        Monitore quem acessou seus dados de saúde. Transparência total para sua tranquilidade.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/20">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">Último Acesso</p>
                                        <p className="text-xl font-bold">
                                            {logs.length > 0 ? formatDateSmart(logs[0].created_at) : '--'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                    </div>


                    {/* Timeline */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {loading ? (
                            <>
                                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Shimmer className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-700" />
                                        <Shimmer className="h-6 w-48 rounded bg-gray-200 dark:bg-slate-700" />
                                    </div>
                                    <Shimmer className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-700" />
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex gap-4">
                                                <Shimmer className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200 dark:bg-slate-700" />
                                                <div className="space-y-2 w-full">
                                                    <Shimmer className="h-4 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
                                                    <Shimmer className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-gray-400" /> Histórico de Atividades
                                    </h3>
                                    <button onClick={loadLogs} className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                                        Atualizar
                                    </button>
                                </div>

                                <div className="p-6">
                                    {logs.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                                            <p className="text-lg font-medium">Nenhum acesso de terceiros registrado.</p>
                                            <p className="text-sm">Acessos feitos por você (dono da conta) não aparecem aqui.</p>
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-gray-100 dark:border-slate-700 ml-6 space-y-8">
                                            {logs
                                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                .map((log, index) => {
                                                    const Icon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                                                    const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS.default;
                                                    const actorName = log.actor?.full_name || log.actor?.email || 'Usuário Desconhecido';

                                                    return (
                                                        <div key={log.id} className="relative pl-8">
                                                            {/* Timeline Dot */}
                                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${log.action === 'DELETE' ? 'bg-red-500' : 'bg-emerald-500'
                                                                }`}></div>

                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between group">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`p-1.5 rounded-md ${colorClass}`}>
                                                                            <Icon size={14} />
                                                                        </span>
                                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                                            {log.action}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">•</span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {format(new Date(log.created_at), "dd 'de' MMM, HH:mm")}
                                                                        </span>
                                                                    </div>

                                                                    <h4 className="text-gray-900 dark:text-white font-medium text-base">
                                                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{actorName}</span>
                                                                        <span className="font-normal text-gray-600 dark:text-gray-300"> acessou </span>
                                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{log.resource}</span>
                                                                    </h4>

                                                                    {log.details && (
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg inline-block border border-gray-100 dark:border-slate-700">
                                                                            {log.details}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                            {/* Pagination Controls */}
                                            {logs.length > itemsPerPage && (
                                                <div className="flex justify-center gap-2 mt-8 pt-4 border-t border-gray-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Anterior
                                                    </button>
                                                    <span className="text-sm py-2 px-4 text-gray-500 dark:text-gray-400">
                                                        Página {currentPage} de {Math.ceil(logs.length / itemsPerPage)}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(logs.length / itemsPerPage), p + 1))}
                                                        disabled={currentPage === Math.ceil(logs.length / itemsPerPage)}
                                                        className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Próxima
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SecurityAudit;
