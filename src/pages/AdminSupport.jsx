import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, Search, ChevronLeft, ChevronRight, MessageSquare, Phone, User, MapPin } from 'lucide-react';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const AdminSupport = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, resolved
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 6;
    const [totalCount, setTotalCount] = useState(0);
    const [expandedIds, setExpandedIds] = useState([]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('support_messages')
                .select('*', { count: 'exact' });

            if (filter === 'pending') query = query.eq('status', 'pending');
            if (filter === 'resolved') query = query.eq('status', 'resolved');

            // Pagination
            const from = page * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setMessages(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [filter, page]);

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
        try {
            const { error } = await supabase
                .from('support_messages')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, status: newStatus } : m
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col gap-6 pb-20 animate-in fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    Painel de Suporte
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Gerencie as solicitações enviadas pelos usuários.
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto">
                <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    onClick={() => { setFilter('all'); setPage(0); }}
                    className="whitespace-nowrap"
                >
                    Todos
                </Button>
                <Button
                    variant={filter === 'pending' ? 'primary' : 'outline'}
                    onClick={() => { setFilter('pending'); setPage(0); }}
                    className="whitespace-nowrap"
                >
                    Pendentes
                </Button>
                <Button
                    variant={filter === 'resolved' ? 'primary' : 'outline'}
                    onClick={() => { setFilter('resolved'); setPage(0); }}
                    className="whitespace-nowrap"
                >
                    Resolvidos
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300">
                    Nenhuma mensagem encontrada.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {messages.map(msg => (
                        <Card key={msg.id} className={`border-l-4 ${msg.status === 'resolved' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${msg.status === 'resolved' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${msg.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {msg.status === 'resolved' ? 'Resolvido' : 'Pendente'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate" title={msg.subject}>
                                    {msg.subject?.replace('[SUPORTE] ', '')}
                                </h3>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <User size={12} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{msg.sender_name}</p>
                                        <p className="text-xs text-slate-500">{msg.sender_email}</p>
                                    </div>
                                </div>

                                {/* Rich Details Preview */}
                                {msg.details && (
                                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                                        {msg.details.age && (
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                                                🎂 {msg.details.age}a
                                            </span>
                                        )}
                                        {msg.details.phone && (
                                            <a
                                                href={`https://wa.me/55${msg.details.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1 hover:bg-green-100 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Phone size={10} /> {msg.details.phone}
                                            </a>
                                        )}
                                        {msg.details.city && (
                                            <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1">
                                                <MapPin size={10} /> {msg.details.city.split('/')[0]}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Shares Details */}
                                {msg.details?.shares && (
                                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                            🤝 Compartilhamentos:
                                        </h4>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                            {msg.details.shares.map((share, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-900 p-1.5 rounded border border-blue-50 dark:border-blue-800">
                                                    <p className="font-semibold text-blue-800 dark:text-blue-200">{share.patientName}:</p>
                                                    <ul className="pl-2 mt-1 space-y-0.5">
                                                        {share.shares.map((s, i) => (
                                                            <li key={i} className="flex flex-wrap gap-1">
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={`text-sm text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 ${expandedIds.includes(msg.id) ? '' : 'line-clamp-3'}`}>
                                    {msg.message}
                                </div>

                                <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs flex-1"
                                        onClick={() => toggleExpand(msg.id)}
                                    >
                                        {expandedIds.includes(msg.id) ? 'Recolher' : 'Ler mensagem completa'}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant={msg.status === 'resolved' ? 'outline' : 'primary'}
                                        className={`text-xs flex-1 ${msg.status === 'resolved' ? 'border-green-200 text-green-700 hover:bg-green-50' : ''}`}
                                        onClick={() => toggleStatus(msg.id, msg.status)}
                                    >
                                        {msg.status === 'resolved' ? 'Reabrir' : 'Dar Baixa'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <Button
                        variant="outline"
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        className="w-10 h-10 p-0 flex items-center justify-center rounded-full"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <span className="text-sm font-medium text-slate-600">
                        Página {page + 1} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        className="w-10 h-10 p-0 flex items-center justify-center rounded-full"
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdminSupport;
```
