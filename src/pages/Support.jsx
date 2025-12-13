import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Send, MessageSquare, User, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const Support = () => {
    const { user } = useAuth();
    const { showToast, patients, medications, prescriptions } = useApp();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            showToast('Por favor, descreva sua dúvida ou problema.', 'error');
            return;
        }

        setSending(true);

        try {
            // Prepare User Data Summary
            // We won't send the full JSON database, just key metrics and ID.
            const stats = `
=== DADOS DO USUÁRIO ===
Nome: ${user?.user_metadata?.full_name || 'N/A'}
Email: ${user?.email}
ID: ${user?.id}
Total Pacientes: ${patients.length}
Total Medicamentos: ${medications.length}
Total Prescrições: ${prescriptions.length}
========================
            `;

            const fullBody = `
MENSAGEM DO USUÁRIO:
${message}

${stats}
            `;

            // Send to the Support Email (Hardcoded for now as the destination)
            await api.sendSupportEmail({
                subject: `[SUPORTE] Dúvida de ${user?.user_metadata?.full_name || user?.email}`,
                text: fullBody,
                senderName: user?.user_metadata?.full_name || 'Usuário',
                senderEmail: user?.email
            });

            setSent(true);
            showToast('Sua mensagem foi enviada com sucesso!', 'success');
            setMessage('');

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            showToast('Erro ao enviar mensagem. Tente novamente mais tarde.', 'error');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Mensagem Recebida!</h2>
                <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Nossa equipe de suporte já recebeu sua solicitação. Responderemos para o seu email <strong>{user?.email}</strong> o mais breve possível.
                </p>
                <Button onClick={() => setSent(false)} variant="outline">
                    Enviar outra mensagem
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-20 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    Fale com o Suporte
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Estamos aqui para ajudar. Envie sua dúvida, sugestão ou relate um problema.
                </p>
            </div>

            <Card className="overflow-hidden border-t-4 border-t-primary">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* Read-only User Info */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={14} /> Seus Dados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Nome</label>
                                    <div className="font-medium text-slate-700 dark:text-slate-200">
                                        {user?.user_metadata?.full_name || 'Não informado'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Email de Resposta</label>
                                    <div className="font-medium text-slate-700 dark:text-slate-200">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>Para agilizar o atendimento, enviaremos automaticamente alguns dados técnicos da sua conta (ID, totais de registros, etc).</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-slate-700 dark:text-slate-200">
                                Como podemos ajudar?
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva sua dúvida ou o problema que encontrou..."
                                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="w-full py-4 text-base shadow-lg hover:shadow-xl transition-all"
                        >
                            {sending ? (
                                'Enviando...'
                            ) : (
                                <>
                                    <Send size={20} className="mr-2" />
                                    Enviar Mensagem
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="text-center text-sm text-slate-400">
                <p>Tempo médio de resposta: 24 horas</p>
            </div>
        </div>
    );
};

export default Support;
