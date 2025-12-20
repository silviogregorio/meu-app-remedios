import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, LogOut, User as UserIcon, Heart, Search, Siren } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationsModal from '../ui/NotificationsModal';
import SOSCard from '../features/SOSCard';
import MedicationSearchModal from '../features/MedicationSearchModal';

import { useTheme } from '../../context/ThemeContext';

const Header = ({ onMenuClick, isPinned }) => {
    const { user, pendingShares, logout, patients, triggerPanicAlert, showToast } = useApp();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [themeState, setThemeState] = useState(localStorage.getItem('theme') || 'light'); // Fallback if context fails, but mostly unused if useTheme works
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [showSearch, setShowSearch] = useState(false); // Added State
    const [isTriggeringPanic, setIsTriggeringPanic] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showPanicConfirm, setShowPanicConfirm] = useState(false); // Novo estado para confirmação

    const targetPatient = patients && patients.length > 0 ? patients[0] : null;

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
        await logout();
        window.location.href = '/';
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 h-[64px] bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 z-30 px-4 flex items-center justify-between shadow-sm transition-all duration-300 ${isPinned ? 'md:left-64' : ''
                }`}
        >
            {/* 1. Menu Toggle (Sempre Visível) */}
            <button
                id="header-menu-toggle"
                onClick={onMenuClick}
                className={`p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors ${isPinned ? 'md:hidden' : ''
                    }`}
            >
                <Menu size={24} />
            </button>

            {/* 2. Logo (Apenas Desktop) */}
            <div className={`hidden md:flex items-center gap-2 ${isPinned ? 'hidden' : ''}`}>
                <img src="/assets/logo.png" alt="SiG Remédios" className="w-8 h-8 object-contain animate-heartbeat" />
                <h1 className="hidden lg:block text-xl font-bold text-[#10b981]">SiG Remédios</h1>
            </div>

            {user && (
                <>
                    {/* 3. Busca */}
                    <button
                        id="tour-search-btn"
                        onClick={() => setShowSearch(true)}
                        className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Buscar Medicamento"
                    >
                        <Search size={22} />
                        <span className="hidden xl:inline text-sm font-medium">Buscar</span>
                    </button>

                    {/* 4. Sirene (Pânico) */}
                    <button
                        id="panic-btn"
                        onClick={handlePanicClick}
                        disabled={isTriggeringPanic}
                        className={`p-2 rounded-full transition-all flex items-center justify-center ${isTriggeringPanic
                            ? 'bg-red-100 text-red-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 active:scale-95 shadow-md border border-red-200'
                            }`}
                        title="BOTÃO DE PÂNICO"
                    >
                        <Siren size={24} className={isTriggeringPanic ? 'animate-spin' : 'animate-pulse'} />
                    </button>

                    {/* 5. SOS (Ficha) */}
                    <button
                        id="tour-sos-btn"
                        onClick={() => setShowSOS(true)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 sm:px-4 sm:py-1.5 rounded-full font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-1.5 animate-pulse-slow"
                    >
                        <Heart size={18} fill="currentColor" />
                        <span className="hidden md:inline">SOS</span>
                    </button>

                    {/* 6. Notificações */}
                    <button
                        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        onClick={() => setShowNotifications(true)}
                        title="Notificações"
                    >
                        <Bell size={24} />
                        {pendingShares.length > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {pendingShares.length}
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
                </>
            )}

            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            {showSOS && <SOSCard onClose={() => setShowSOS(false)} />}



            {/* Modal de Confirmação de Pânico Customizado */}
            {showPanicConfirm && (
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
            )}

            <MedicationSearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
            />
        </header>
    );
};

export default Header;
