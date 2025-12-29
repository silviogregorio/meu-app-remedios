import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { Shield, AlertTriangle, Activity, Clock, MapPin, TrendingUp, Key, QrCode } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const AdminSecurity = () => {
    const { showToast } = useApp();
    const [suspiciousActivities, setSuspiciousActivities] = useState([]);
    const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
    const [activityData, setActivityData] = useState([]);
    const [loading, setLoading] = useState(true);

    // MFA States
    const { enrollMFA, verifyMFA, unenrollMFA, getMFAFactors, mfaEnabled } = useAuth();
    const [mfaData, setMfaData] = useState(null); // { qrCode: '', factorId: '', challengeId: '' }
    const [mfaStep, setMfaStep] = useState('status'); // 'status', 'enroll', 'verify'
    const [verificationCode, setVerificationCode] = useState('');
    const [isMfaLoading, setIsMfaLoading] = useState(false);

    const handleStartMfaEnroll = async () => {
        setIsMfaLoading(true);
        try {
            // Fix: Check if there are already factors to prevent the "friendly name exists" error
            const { data: factorsData } = await getMFAFactors();
            const unverifiedFactor = factorsData?.all?.find(f => f.status === 'unverified');

            if (unverifiedFactor) {
                // If there's an unverified factor, we unenroll it first to start clean
                await unenrollMFA(unverifiedFactor.id);
            }

            const { data, error } = await enrollMFA();
            if (error) throw error;

            // Generate QR Code URL using Google Charts API (more stable and usually whitelisted)
            const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(data.totp.qr_code)}`;

            setMfaData({
                factorId: data.id,
                uri: data.totp.uri // Fixed: Use .uri, not .qr_code (which is an SVG)
            });
            setMfaStep('enroll');
        } catch (error) {
            console.error('Error starting MFA enroll:', error);
            showToast('Erro ao iniciar configuração de 2FA', 'error');
        } finally {
            setIsMfaLoading(false);
        }
    };

    const handleVerifyAndEnableMfa = async () => {
        if (verificationCode.length !== 6) return;
        setIsMfaLoading(true);
        try {
            // First we need a challenge
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaData.factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await verifyMFA(mfaData.factorId, challengeData.id, verificationCode);
            if (verifyError) throw verifyError;

            showToast('2FA ativado com sucesso!', 'success');
            setMfaStep('status');
            setMfaData(null);
            setVerificationCode('');
            // Refresh factors
            window.location.reload(); // Simple way to refresh mfaEnabled from context
        } catch (error) {
            console.error('Error verifying MFA:', error);
            showToast('Código inválido ou erro na verificação', 'error');
        } finally {
            setIsMfaLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!window.confirm('Tem certeza que deseja desativar o 2FA? Isso reduzirá a segurança da sua conta.')) return;

        setIsMfaLoading(true);
        try {
            const { data: factors } = await getMFAFactors();
            const totpFactor = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');

            if (totpFactor) {
                const { error } = await unenrollMFA(totpFactor.id);
                if (error) throw error;
                showToast('2FA desativado.', 'info');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error disabling MFA:', error);
            showToast('Erro ao desativar 2FA', 'error');
        } finally {
            setIsMfaLoading(false);
        }
    };

    const handleClearAllMfaFactors = async () => {
        if (!window.confirm('Isso vai remover TODOS os fatores de 2FA. Você será deslogado. Continuar?')) return;

        setIsMfaLoading(true);
        try {
            const { data: factors } = await getMFAFactors();
            const allFactors = [...(factors?.totp || []), ...(factors?.phone || [])];

            console.log('🧹 Cleaning up all MFA factors:', allFactors);

            for (const factor of allFactors) {
                await unenrollMFA(factor.id);
                console.log('🗑️ Removed factor:', factor.id, factor.status);
            }

            showToast('2FA removido. Redirecionando...', 'success');
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error clearing MFA factors:', error);
            showToast('Erro ao limpar fatores de 2FA', 'error');
            setIsMfaLoading(false);
        }
    };

    // Fetch suspicious activities
    const fetchSuspiciousActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .or('is_suspicious.eq.true,risk_level.eq.high,risk_level.eq.critical')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setSuspiciousActivities(data || []);

            // Calculate stats
            const counts = { critical: 0, high: 0, medium: 0, low: 0 };
            data?.forEach(log => {
                counts[log.risk_level] = (counts[log.risk_level] || 0) + 1;
            });
            setStats(counts);
        } catch (error) {
            console.error('Error fetching suspicious activities:', error);
            showToast('Erro ao carregar atividades suspeitas', 'error');
        }
    };

    // Fetch activity data for chart (last 24 hours)
    const fetchActivityData = async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabase
                .from('audit_logs')
                .select('created_at, risk_level')
                .gte('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by hour
            const hourlyData = {};
            data?.forEach(log => {
                const hour = new Date(log.created_at).getHours();
                if (!hourlyData[hour]) {
                    hourlyData[hour] = { hour: `${hour}h`, total: 0, suspicious: 0 };
                }
                hourlyData[hour].total += 1;
                if (log.risk_level === 'high' || log.risk_level === 'critical') {
                    hourlyData[hour].suspicious += 1;
                }
            });

            const chartData = Object.values(hourlyData);
            setActivityData(chartData);
        } catch (error) {
            console.error('Error fetching activity data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchSuspiciousActivities();
        fetchActivityData();
    }, []);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchSuspiciousActivities();
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Risk level color helper
    const getRiskColor = (level) => {
        switch (level) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            default: return '⚪';
        }
    };

    // Format timestamp
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d atrás`;
        if (diffHours > 0) return `${diffHours}h atrás`;
        if (diffMins > 0) return `${diffMins}min atrás`;
        return 'Agora';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-xl">
                    <Shield className="text-red-600" size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard de Segurança</h1>
                    <p className="text-slate-500">Monitoramento em tempo real e proteção avançada</p>
                </div>
            </div>

            {/* MFA Management Section */}
            <Card className={`border-2 ${mfaEnabled ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Key size={24} className={mfaEnabled ? 'text-green-600' : 'text-blue-600'} />
                            <h2 className="text-xl font-bold">Autenticação em Duas Etapas (2FA)</h2>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {mfaEnabled ? 'Ativado' : 'Configuração Recomendada'}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-slate-600 mb-4">
                                Adicione uma camada extra de segurança à sua conta de administrador. Após logar com sua senha,
                                você precisará fornecer um código de 6 dígitos gerado por um aplicativo (Google Authenticator, Authy, etc).
                            </p>

                            {mfaStep === 'status' && (
                                <div className="space-y-4">
                                    {mfaEnabled ? (
                                        <button
                                            onClick={handleDisableMfa}
                                            disabled={isMfaLoading}
                                            className="px-6 py-2 bg-white border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            {isMfaLoading ? 'Processando...' : 'Desativar 2FA'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStartMfaEnroll}
                                            disabled={isMfaLoading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                        >
                                            <QrCode size={18} />
                                            {isMfaLoading ? 'Iniciando...' : 'Configurar 2FA Agora'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {mfaStep === 'enroll' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 inline-block shadow-sm">
                                        <QRCodeSVG
                                            value={mfaData.uri}
                                            size={200}
                                            level="L"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-bold text-slate-800">1. Escaneie o código acima</p>
                                        <p className="text-sm text-slate-500 italic">Ou insira manualmente: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs select-all text-blue-600 font-bold">{mfaData.uri.split('secret=')[1]?.split('&')[0]}</code></p>
                                        <button
                                            onClick={() => setMfaStep('verify')}
                                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                                        >
                                            Já escaneei, continuar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mfaStep === 'verify' && (
                                <div className="space-y-4">
                                    <p className="font-bold text-slate-800">2. Confirme o código de 6 dígitos</p>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full max-w-[200px] text-center text-3xl font-mono py-3 border-2 border-blue-200 rounded-xl bg-white outline-none focus:border-blue-500"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleVerifyAndEnableMfa}
                                            disabled={isMfaLoading || verificationCode.length !== 6}
                                            className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                                        >
                                            {isMfaLoading ? 'Verificando...' : 'Ativar Proteção'}
                                        </button>
                                        <button
                                            onClick={() => setMfaStep('enroll')}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-700"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={handleClearAllMfaFactors}
                                            className="px-4 py-2 text-red-500 hover:text-red-700 underline text-sm"
                                        >
                                            Limpar e Reiniciar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/50 p-6 rounded-2xl border border-slate-200 hidden md:block">
                            <h3 className="font-bold text-slate-800 mb-2">Por que usar 2FA?</h3>
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <span>Impede acesso mesmo se sua senha for roubada.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <span>Proteção robusta contra ataques de força bruta.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <span>Padrão de segurança exigido por regulamentações de dados.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">CRÍTICO</p>
                                <p className="text-3xl font-bold text-red-900">{stats.critical}</p>
                            </div>
                            <AlertTriangle className="text-red-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-600 font-medium">ALTO</p>
                                <p className="text-3xl font-bold text-orange-900">{stats.high}</p>
                            </div>
                            <AlertTriangle className="text-orange-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600 font-medium">MÉDIO</p>
                                <p className="text-3xl font-bold text-yellow-900">{stats.medium}</p>
                            </div>
                            <Activity className="text-yellow-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">BAIXO</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.low}</p>
                            </div>
                            <Shield className="text-gray-600" size={32} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={20} />
                        <h2 className="text-xl font-bold">Atividade nas Últimas 24 Horas</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
                            <Line type="monotone" dataKey="suspicious" stroke="#dc2626" name="Suspeitas" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Suspicious Activities List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-600" />
                            <h2 className="text-xl font-bold">Atividades Suspeitas Recentes</h2>
                        </div>
                        <span className="text-sm text-slate-500">Atualiza a cada 10s</span>
                    </div>
                </CardHeader>
                <CardContent>
                    {suspiciousActivities.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Shield className="mx-auto mb-4 text-slate-300" size={48} />
                            <p className="font-medium">Nenhuma atividade suspeita detectada</p>
                            <p className="text-sm">Sistema funcionando normalmente</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {suspiciousActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`p-4 border rounded-xl ${getRiskColor(activity.risk_level)}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getRiskIcon(activity.risk_level)}</span>
                                            <div>
                                                <p className="font-bold text-sm uppercase">{activity.risk_level}</p>
                                                <p className="text-sm font-medium">{activity.user_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock size={14} />
                                            {formatTimeAgo(activity.created_at)}
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <p><strong>Ação:</strong> <code className="bg-black/10 px-2 py-0.5 rounded">{activity.action}</code></p>
                                        {activity.ip_address && (
                                            <p className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                <strong>IP:</strong> {activity.ip_address}
                                            </p>
                                        )}
                                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer font-medium">Ver Detalhes</summary>
                                                <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(activity.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSecurity;
