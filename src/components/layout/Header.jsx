import { useRef, useState, forwardRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, LogOut, User as UserIcon, Heart, Search, Siren, UserCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import NotificationsModal from '../ui/NotificationsModal';
import SOSCard from '../features/SOSCard';
import MedicationSearchModal from '../features/MedicationSearchModal';
import { StockService } from '../../services/stockService';

import { useTheme } from '../../context/ThemeContext';

const Header = forwardRef(({ onMenuClick, isPinned }, ref) => {
    const { user, pendingShares, logout, patients, triggerPanicAlert, showToast, medications, prescriptions } = useApp();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    // Calculate low stock medications count
    const lowStockCount = useMemo(() => {
        return StockService.getLowStockMedications(medications || [], prescriptions || [], 7).length;
    }, [medications, prescriptions]);

    const totalNotifications = (pendingShares?.length || 0) + lowStockCount;
    const [themeState, setThemeState] = useState(localStorage.getItem('theme') || 'light');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [isTriggeringPanic, setIsTriggeringPanic] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showPanicConfirm, setShowPanicConfirm] = useState(false);

    const targetPatient = patients && patients.length > 0 ? patients[0] : null;
    const [sosFeedback, setSosFeedback] = useState(null);

    // Listen for SOS Acknowledgments (Patient Side)
    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('sos-feedback')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sos_alerts',
                filter: `triggered_by=eq.${user.id}`
            }, async (payload) => {
                const alert = payload.new;
                if (alert.status === 'acknowledged' && alert.acknowledged_by) {
                    // Fetch caregiver name
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', alert.acknowledged_by)
                        .single();

                    if (profile) {
                        setSosFeedback(`${profile.full_name} já viu seu alerta e está a caminho!`);
                        // Auto-hide after 10 seconds or when alert is resolved
                        setTimeout(() => setSosFeedback(null), 10000);
                    }
                } else if (alert.status === 'resolved') {
                    setSosFeedback(null);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // ... (keep handlePanicClick and confirmedPanicAlert) ...

    const handlePanicClick = async () => {
        console.log('🚨 Panic Button Clicked. Patients count:', patients?.length);
        if (!patients || patients.length === 0) {
            showToast('Nenhum paciente cadastrado para disparar SOS.', 'error');
            return;
        }

        // Em vez de window.confirm, vamos abrir um estado de confirmação interno
        setShowPanicConfirm(true);
    };

    const confirmPanicAlert = async () => {
        setShowPanicConfirm(false);
        const targetPatient = patients[0];

        console.log('✅ Confirmação aceita via UI. Iniciando geolocalização...');
        setIsTriggeringPanic(true);
        showToast('Obtendo localização...', 'info');

        if (!navigator.geolocation) {
            console.error('❌ Geolocalização não disponível no navegador.');
            showToast('Geolocalização não suportada neste navegador.', 'error');
            setIsTriggeringPanic(false);
            return;
        }

        // Controle Sênior de Telemetria
        let hasSent = false;
        let bestPos = null;
        let watchId = null;
        const MAX_WAIT_TIME = 3000; // 3 segundos - Envio Rápido para garantir segurança em caso de fechamento

        const fetchGoogleLocation = async () => {
            const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!GOOGLE_API_KEY) return null;
            try {
                console.log('🌍 [SOS] Consultando Google Geolocation API...');
                const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ considerIp: true })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.location) {
                        return {
                            latitude: data.location.lat,
                            longitude: data.location.lng,
                            accuracy: data.accuracy,
                            source: 'google-api'
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ [SOS] Falha na Google Geolocation API:', error);
            }
            return null;
        };

        const fetchGeocodedAddress = async () => {
            const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!GOOGLE_API_KEY) return null;

            // Verificar se o usuário tem endereço cadastrado no profile
            const meta = user?.user_metadata;
            if (!meta?.street || !meta?.city || !meta?.state) {
                console.log('⚠️ [SOS] Endereço incompleto no perfil.');
                return null;
            }

            const addressString = `${meta.street}, ${meta.number || ''} - ${meta.neighborhood || ''}, ${meta.city} - ${meta.state}, Brasil`;
            console.log(`🌍 [SOS] Geocodificando endereço do perfil: ${addressString}`);

            try {
                const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${GOOGLE_API_KEY}`);
                const data = await res.json();

                if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
                    const loc = data.results[0].geometry.location;
                    return {
                        latitude: loc.lat,
                        longitude: loc.lng,
                        accuracy: 20, // Geocoding preciso é excelente
                        source: 'google-geocode-profile'
                    };
                } else {
                    console.warn('⚠️ [SOS] Geocoding falhou:', data.status);
                }
            } catch (error) {
                console.warn('⚠️ [SOS] Erro no Geocoding:', error);
            }
            return null;
        };

        const sendFinalAlert = async (pos, source = 'sensor') => {
            if (hasSent) return;
            hasSent = true;

            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }

            let finalLat = pos?.coords?.latitude || pos?.latitude || null;
            let finalLng = pos?.coords?.longitude || pos?.longitude || null;
            let finalAccuracy = pos?.coords?.accuracy || pos?.accuracy || null;
            let finalSource = source;
            let finalAddress = null; // NEW: Track address text

            // Lógica Híbrida de Refinamento (Google API + Geocoding)
            // Se a precisão for ruim (> 500m) OU se não tivermos posição nenhuma
            if (!finalLat || finalAccuracy > 500) {
                showToast('Refinando localização...', 'info');

                // Tenta Geolocation API primeiro (Wifi/Cell)
                const googlePos = await fetchGoogleLocation();
                if (googlePos && googlePos.accuracy < 2000) {
                    console.log(`🛡️ [SOS] Google Geolocation melhorou: ${googlePos.accuracy}m`);
                    finalLat = googlePos.latitude;
                    finalLng = googlePos.longitude;
                    finalAccuracy = googlePos.accuracy;
                    finalSource = 'google-geolocation';
                }

                // Se AINDA estiver ruim (> 200m), TENTA O ENDEREÇO DO PERFIL
                // Isso resolve o caso do desktop sem GPS e sem Wifi Scanning (IP puro)
                if (!finalLat || finalAccuracy > 200) {
                    const profilePos = await fetchGeocodedAddress();
                    if (profilePos) {
                        console.log(`🛡️ [SOS] Usando Endereço do Perfil!`);
                        finalLat = profilePos.latitude;
                        finalLng = profilePos.longitude;
                        finalAccuracy = profilePos.accuracy;
                        finalSource = 'profile-address';

                        // IMPORTANT: Build address string to pass to backend
                        const meta = user?.user_metadata;
                        if (meta?.street && meta?.city && meta?.state) {
                            finalAddress = `${meta.street}, ${meta.number || ''} - ${meta.neighborhood || ''}, ${meta.city} - ${meta.state}, Brasil`;
                        }

                        showToast('Usando endereço cadastrado no perfil.', 'success');
                    }
                }
            }

            console.log(`📍 [SOS] ALERT FINAL via ${finalSource}. Lat: ${finalLat}, Lng: ${finalLng}, Precisão: ${finalAccuracy}m${finalAddress ? `, Endereço: ${finalAddress}` : ''}`);

            try {
                if (finalAccuracy > 500 && finalSource !== 'profile-address') {
                    showToast(`Localização aproximada (Precisão: ${Math.round(finalAccuracy)}m).`, 'info');
                }

                if (!finalLat) {
                    showToast('Não foi possível obter localização. Enviando alerta simples.', 'warning');
                }

                // Pass address as 5th parameter
                await triggerPanicAlert(targetPatient.id, finalLat, finalLng, finalAccuracy, finalAddress);
                console.log('✅ [SOS] Sucesso.');
            } catch (err) {
                console.error('❌ [SOS] Erro fatal:', err);
                showToast('Erro ao enviar SOS. Tente novamente.', 'error');
            } finally {
                setIsTriggeringPanic(false);
            }
        };

        // PASSO 1: IP Baseline
        console.log('🌐 [SOS] Buscando baseline via IP...');
        fetch('https://ipapi.co/json/').then(res => res.json()).then(data => {
            if (!hasSent && data.latitude) {
                bestPos = { latitude: data.latitude, longitude: data.longitude, accuracy: 5000 };
            }
        }).catch(() => { });

        // PASSO 2: Browser Sensor
        const startWatching = () => {
            console.log('🛰️ [SOS] Iniciando sensor...');
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { accuracy } = position.coords;
                    console.log(`📡 [SOS] Sensor: ${Math.round(accuracy)}m`);
                    if (!bestPos || accuracy < (bestPos.coords?.accuracy || bestPos.accuracy)) {
                        bestPos = position;
                    }
                    if (accuracy < 100) {
                        sendFinalAlert(position, 'sensor-high');
                    }
                },
                (error) => {
                    if (error.code === 1) sendFinalAlert(bestPos, 'fallback-ip-denied');
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
            );
        };

        startWatching();

        // PASSO 3: Timeout
        setTimeout(() => {
            if (!hasSent) {
                console.log('⏰ [SOS] Timeout. Despachando melhor sinal disponível.');
                sendFinalAlert(bestPos, bestPos?.coords ? 'sensor-best' : 'ip-baseline');
            }
        }, MAX_WAIT_TIME);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
    };

    const handleLogout = async () => {
        console.log('🚪 Header: Iniciando logout...');
        try {
            // Race between the actual logout and a 2s timeout
            await Promise.race([
                logout(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 2000))
            ]);
            console.log('🚪 Header: Logout concluído, redirecionando...');
        } catch (err) {
            console.warn('🚪 Header: Erro ou timeout no logout, forçando redirecionamento:', err);
        } finally {
            window.location.href = '/';
        }
    };

    return (
        <header
            ref={ref}
            className={`fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 z-50 px-4 flex items-center justify-between shadow-sm transition-all duration-300 ${isPinned ? 'md:left-64' : ''}`}
            style={{ minHeight: '64px' }}
        >
            {/* SOS Feedback Banner (Patient Side) */}
            {sosFeedback && (
                <div className="absolute top-[64px] left-0 right-0 bg-emerald-600 text-white py-3 px-4 flex items-center justify-center gap-3 animate-slide-down z-40 shadow-lg">
                    <UserCheck className="animate-bounce" />
                    <span className="font-bold text-sm sm:text-base">{sosFeedback}</span>
                    <button onClick={() => setSosFeedback(null)} className="ml-auto bg-white/20 p-1 rounded-full"><X size={16} /></button>
                </div>
            )}

            {/* 1. Menu Toggle (Sempre Visível) */}
            <button
                id="header-menu-toggle"
                onClick={onMenuClick}
                className={`p-3 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${isPinned ? 'md:hidden' : ''
                    }`}
                aria-label="Abrir menu de navegação"
            >
                <Menu size={24} />
            </button>

            {/* 2. Logo (Apenas Desktop) */}
            <div className={`hidden md:flex items-center gap-2 ${isPinned ? 'hidden' : ''}`}>
                <img src="/assets/logo.png" alt="SiG Remédios" className="w-8 h-8 object-contain animate-heartbeat" />
                <h1 className="hidden lg:block text-xl font-bold text-[#10b981]">SiG Remédios</h1>
            </div>

            {user && (
                <div className="flex items-center gap-2 sm:gap-4 md:gap-6 ml-auto min-w-0">
                    {/* Ações Mobile - Gap reduzido para caber com fontes grandes */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            title="Buscar Medicamento"
                            aria-label="Buscar medicamento por nome"
                        >
                            <Search size={22} />
                        </button>

                        <button
                            className="relative min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            onClick={() => setShowNotifications(true)}
                            title="Notificações"
                            aria-label={`Notificações${totalNotifications > 0 ? ` - ${totalNotifications} pendente(s)` : ''}`}
                        >
                            <Bell size={22} />
                            {totalNotifications > 0 && (
                                <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white ${lowStockCount > 0 && (pendingShares?.length || 0) === 0 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}>
                                    {totalNotifications}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={handlePanicClick}
                            disabled={isTriggeringPanic}
                            className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full transition-all shadow-md border ${isTriggeringPanic
                                ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:scale-110 active:scale-95'
                                }`}
                            title="BOTÃO DE PÂNICO"
                            aria-label="Acionar botão de emergência"
                        >
                            <Siren size={24} className={isTriggeringPanic ? 'animate-spin' : 'animate-pulse'} />
                        </button>
                    </div>

                    {/* 3. Busca (Desktop) */}
                    <button
                        id="tour-search-btn"
                        onClick={() => setShowSearch(true)}
                        className="hidden md:flex items-center gap-2 p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[48px]"
                        title="Buscar Medicamento"
                        aria-label="Buscar medicamento por nome"
                    >
                        <Search size={22} />
                        <span className="hidden xl:inline text-sm font-medium">Buscar</span>
                    </button>

                    {/* 4. Sirene (Pânico) (Desktop) */}
                    <button
                        id="emergency-alert-btn"
                        onClick={handlePanicClick}
                        disabled={isTriggeringPanic}
                        className={`hidden md:flex p-3 rounded-full transition-all items-center justify-center min-h-[48px] min-w-[48px] ${isTriggeringPanic
                            ? 'bg-red-100 text-red-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 active:scale-95 shadow-md border border-red-200'
                            }`}
                        title="BOTÃO DE PÂNICO"
                        aria-label="Acionar botão de emergência"
                    >
                        <Siren size={24} className={`text-red-600 ${isTriggeringPanic ? 'animate-spin' : 'animate-pulse'}`} />
                    </button>

                    {/* 5. SOS (Ficha) */}
                    <button
                        id="tour-sos-btn"
                        onClick={() => setShowSOS(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-1.5 animate-pulse-slow shrink-0 min-h-[48px]"
                        aria-label="Abrir ficha de emergência SOS"
                    >
                        <Heart size={16} fill="currentColor" />
                        <span className="hidden md:inline">SOS</span>
                        <span className="md:hidden text-xs">Ficha</span>
                    </button>

                    {/* 6. Notificações (Desktop) */}
                    <button
                        className="hidden md:block relative p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors min-h-[48px] min-w-[48px]"
                        onClick={() => setShowNotifications(true)}
                        title="Notificações"
                        aria-label={`Notificações${totalNotifications > 0 ? ` - ${totalNotifications} pendente(s)` : ''}`}
                    >
                        <Bell size={24} />
                        {totalNotifications > 0 && (
                            <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white ${lowStockCount > 0 && (pendingShares?.length || 0) === 0 ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                {totalNotifications}
                            </span>
                        )}
                    </button>

                    {/* 7. Perfil */}
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-xl transition-colors"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <span className="text-sm font-medium text-[#64748b] hidden xl:block">
                                Olá, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}
                            </span>
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="User"
                                    className="w-8 h-8 rounded-full border border-[#e2e8f0]"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                    {getInitials(user.user_metadata?.full_name)}
                                </div>
                            )}
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setIsUserMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 py-1 z-40 animate-fade-in-down">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                    >
                                        <UserIcon size={16} />
                                        Editar Perfil
                                    </button>

                                    <button
                                        onClick={() => {
                                            toggleTheme();
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                    >
                                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                                    </button>

                                    <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Sair
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            {showSOS && <SOSCard onClose={() => setShowSOS(false)} />}



            {/* Modal de Confirmação de Pânico Customizado */}
            {
                showPanicConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-red-100 dark:border-red-900/30 overflow-hidden relative">
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full blur-3xl"></div>
                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                    <Siren size={32} className="text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar Alerta SOS?</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                                    Isso enviará sua localização atual para {patients[0]?.name} e para seus contatos de emergência.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowPanicConfirm(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmPanicAlert}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
                                    >
                                        Enviar Agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <MedicationSearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
            />
        </header >
    );
});

export default Header;
