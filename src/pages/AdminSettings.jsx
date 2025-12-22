import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Settings, Save, RotateCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AdminSettings = () => {
    const { showToast } = useApp();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Buscar configurações ao montar
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .eq('key', 'alerts')
                .single();

            if (error) throw error;

            setSettings(data);
            setHasChanges(false);
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            showToast('Erro ao carregar configurações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        // Validações
        if (settings.low_stock_threshold_days < 1 || settings.low_stock_threshold_days > 30) {
            showToast('O prazo deve estar entre 1 e 30 dias', 'error');
            return;
        }

        if (settings.weekly_report_day_of_week < 0 || settings.weekly_report_day_of_week > 6) {
            showToast('Dia da semana inválido', 'error');
            return;
        }

        if (settings.weekly_report_hour < 0 || settings.weekly_report_hour > 23) {
            showToast('Hora inválida (0-23)', 'error');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .update({
                    low_stock_threshold_days: settings.low_stock_threshold_days,
                    weekly_report_enabled: settings.weekly_report_enabled,
                    weekly_report_day_of_week: settings.weekly_report_day_of_week,
                    weekly_report_hour: settings.weekly_report_hour,
                    email_notifications_enabled: settings.email_notifications_enabled,
                    push_notifications_enabled: settings.push_notifications_enabled,
                    whatsapp_enabled: settings.whatsapp_enabled
                })
                .eq('key', 'alerts');

            if (error) throw error;

            showToast('Configurações salvas com sucesso!', 'success');
            setHasChanges(false);
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showToast('Erro ao salvar configurações', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchSettings();
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="p-4 md:p-6">
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12">
                        <AlertCircle size={48} className="text-red-500" />
                        <p className="text-slate-600">Não foi possível carregar as configurações</p>
                        <Button onClick={fetchSettings}>Tentar Novamente</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header Mobile-First */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Settings size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Configurações do Sistema</h1>
                            <p className="text-indigo-100 text-sm md:text-base">Gerencie parâmetros globais do aplicativo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">Alterações aplicadas imediatamente</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Todas as configurações afetam todos os usuários do sistema instantaneamente
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alertas de Estoque */}
                <Card className="shadow-lg">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle size={20} className="text-amber-500" />
                            Alertas de Estoque Baixo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-6">

                        {/* Prazo Mínimo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Prazo Mínimo de Estoque (dias)
                            </label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={settings.low_stock_threshold_days}
                                    onChange={(e) => handleChange('low_stock_threshold_days', parseInt(e.target.value))}
                                    className="max-w-[120px] text-lg font-bold text-center"
                                />
                                <span className="text-slate-600 dark:text-slate-400 text-sm">
                                    dias de estoque restante
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Usuários receberão alertas quando o estoque de um medicamento durar menos que{' '}
                                <strong className="text-amber-600 dark:text-amber-400">{settings.low_stock_threshold_days} dias</strong>
                            </p>
                        </div>

                        {/* Preview Card Mobile-Friendly */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                📋 Exemplo de Alerta:
                            </p>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-medium">
                                        Estoque de Paracetamol acaba em {settings.low_stock_threshold_days} dias
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tipos de Notificações */}
                <Card className="shadow-lg">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                        <CardTitle>Tipos de Notificações Habilitadas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">

                        {/* Email Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">📧 Email</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Enviar alertas por email</p>
                            </div>
                            <button
                                onClick={() => handleChange('email_notifications_enabled', !settings.email_notifications_enabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.email_notifications_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Push Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">🔔 Push Notifications</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Notificações push no celular</p>
                            </div>
                            <button
                                onClick={() => handleChange('push_notifications_enabled', !settings.push_notifications_enabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.push_notifications_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.push_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* WhatsApp Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">💬 WhatsApp</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Links para WhatsApp nos alertas</p>
                            </div>
                            <button
                                onClick={() => handleChange('whatsapp_enabled', !settings.whatsapp_enabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Resumo Semanal Automático */}
                <Card className="shadow-lg">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2">
                            📊 Resumo Semanal Automático
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-6">

                        {/* Habilitar/Desabilitar */}
                        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <div className="flex-1">
                                <p className="font-medium text-indigo-900 dark:text-indigo-100">🤖 Envio Automático</p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">Email semanal com estatísticas de adesão</p>
                            </div>
                            <button
                                onClick={() => handleChange('weekly_report_enabled', !settings.weekly_report_enabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.weekly_report_enabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.weekly_report_enabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        {/* Dia da Semana */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Dia da Semana
                            </label>
                            <select
                                value={settings.weekly_report_day_of_week}
                                onChange={(e) => handleChange('weekly_report_day_of_week', parseInt(e.target.value))}
                                disabled={!settings.weekly_report_enabled}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            >
                                <option value={0}>🌅 Domingo</option>
                                <option value={1}>📅 Segunda-feira</option>
                                <option value={2}>📅 Terça-feira</option>
                                <option value={3}>📅 Quarta-feira</option>
                                <option value={4}>📅 Quinta-feira</option>
                                <option value={5}>📅 Sexta-feira</option>
                                <option value={6}>📅 Sábado</option>
                            </select>
                        </div>

                        {/* Horário */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Horário
                            </label>
                            <div className="flex items-center gap-4">
                                <select
                                    value={settings.weekly_report_hour}
                                    onChange={(e) => handleChange('weekly_report_hour', parseInt(e.target.value))}
                                    disabled={!settings.weekly_report_enabled}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {i.toString().padStart(2, '0')}:00
                                        </option>
                                    ))}
                                </select>
                                <span className="text-slate-600 dark:text-slate-400 text-sm">
                                    (horário do servidor)
                                </span>
                            </div>
                        </div>

                        {/* Preview */}
                        {settings.weekly_report_enabled && (
                            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                    📅 Próximo envio:
                                </p>
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][settings.weekly_report_day_of_week]} às{' '}
                                        {settings.weekly_report_hour.toString().padStart(2, '0')}:00
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Cuidadores receberão resumo de adesão da semana anterior
                                    </p>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 sm:static">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                        disabled={!hasChanges || saving}
                    >
                        <RotateCw size={18} />
                        Descartar Alterações
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar Configurações
                            </>
                        )}
                    </Button>
                </div>

                {/* Success Indicator */}
                {!hasChanges && !loading && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in">
                        <CheckCircle2 size={16} />
                        <span>Todas as alterações foram salvas</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
