import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { Shield, AlertTriangle, Activity, Clock, MapPin, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';

const AdminSecurity = () => {
    const { showToast } = useApp();
    const [suspiciousActivities, setSuspiciousActivities] = useState([]);
    const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
    const [activityData, setActivityData] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    <p className="text-slate-500">Monitoramento em tempo real de atividades suspeitas</p>
                </div>
            </div>

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
