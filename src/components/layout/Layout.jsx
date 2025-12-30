import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom'; // updated import
import Header from './Header';
import Sidebar from '../ui/Sidebar';
import Shimmer from '../ui/Shimmer';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import SOSMonitor from '../features/SOSMonitor';
import SOSPatientFeedback from '../features/SOSPatientFeedback';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { setupOnMessageListener } from '../../utils/firebase';

const Layout = () => {
    const { accessibility, showToast, loadingData } = useApp();
    const { mfaRequired, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(() => {
        const saved = localStorage.getItem('sidebarPinned');
        return saved === 'true';
    });
    const [headerHeight, setHeaderHeight] = useState(64);
    const headerRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Simulate page loading for smooth transitions matching page shimmers
    const [isPageLoading, setIsPageLoading] = useState(false);

    useEffect(() => {
        setIsPageLoading(true);
        const timer = setTimeout(() => setIsPageLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const showBackButton = location.pathname !== '/' && location.pathname !== '/app';

    // Use ref to avoid recreating listener when showToast changes
    const showToastRef = useRef(showToast);
    useEffect(() => {
        showToastRef.current = showToast;
    }, [showToast]);

    useEffect(() => {
        if (!headerRef.current) return;

        const updateHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(headerRef.current);

        updateHeight();
        return () => resizeObserver.disconnect();
    }, []);

    // Unified handler for FCM messages (from foreground or broadcast)
    const handleFCMMessage = (payload) => {
        // Normalize payload structure
        // Broadcast payload comes as flat data, onMessage payload has notification/data keys
        const data = payload.data || payload;
        const notification = payload.notification || {};

        const title = notification.title || data.title || 'SiG Remédios';
        const body = notification.body || data.body || data.message || 'Nova notificação';
        const mapUrl = data.mapUrl;

        // PLAY ALERT SOUND for SOS notifications
        if (data.type === 'sos') {
            console.log('📢 Visual SOS feedback only (audio handled by SOSMonitor)');
        }

        // Show in-app toast
        if (data.type === 'sos') {
            const pName = data.patientName || 'Paciente';
            const pPhone = data.formattedPhone || '(sem telefone)';

            showToastRef.current(
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-red-600 font-bold uppercase text-xs tracking-wider">
                        <AlertCircle size={14} /> Emergência SOS
                    </div>
                    <div>
                        <span className="font-black text-slate-900">{pName}</span>
                        <span className="text-slate-600"> ({pPhone})</span>
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">
                        Está precisando de ajuda URGENTE!
                    </div>
                </div>,
                'error',
                0 // Persistent - user must close manually
            );
        } else {
            showToastRef.current(`🔔 ${title}: ${body}`, 'info');
        }
    };

    // Listen for foreground FCM push notifications
    useEffect(() => {
        console.log('🔔 Setting up foreground FCM listener (once)...');

        const unsubscribe = setupOnMessageListener((payload) => {
            console.log('🔔 Layout received FCM message:', payload);
            handleFCMMessage(payload);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Listen for BroadcastChannel messages from Service Worker
    useEffect(() => {
        const channel = new BroadcastChannel('fcm-push-channel');

        channel.onmessage = (event) => {
            console.log('📢 BroadcastChannel message from SW:', event.data);
            if (event.data?.type === 'FCM_PUSH') {
                // Broadcast sends the raw data object
                handleFCMMessage({ data: event.data });
            }
        };

        return () => {
            channel.close();
        };
    }, []);

    const togglePin = () => {
        const newState = !isPinned;
        setIsPinned(newState);
        localStorage.setItem('sidebarPinned', newState);

        // Se estiver desafixando, fecha o menu automaticamente
        if (isPinned) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className={`min-h-screen bg-[#f8fafc] dark:bg-slate-950 relative overflow-x-hidden transition-colors duration-300 ${accessibility?.largeText ? 'senior-text' : ''}`}>
            {/* Gradient decorations in corners */}
            <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/50 via-emerald-50/25 to-transparent rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-50/45 via-teal-50/25 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            {/* Blue Gradient Vignette (Desktop Only) - DOM Inspection Style */}
            <div className="hidden lg:block fixed inset-0 z-[100] pointer-events-none shadow-[inset_0px_0px_25px_rgba(59,130,246,0.8)] dark:shadow-[inset_0px_0px_25px_rgba(30,58,138,0.8)] transition-all duration-500"></div>

            {/* Content Wrapper with Sidebar Offset */}
            <div className={`transition-all duration-300 ease-in-out ${isPinned ? 'md:ml-64' : ''}`}>
                {/* Hide Header when loading or MFA verification is pending (mfaRequired is true or null) */}
                {!loading && mfaRequired === false && (
                    <Header
                        onMenuClick={() => setIsSidebarOpen(true)}
                        isPinned={isPinned}
                        ref={headerRef}
                    />
                )}

                <main
                    className="px-4 pb-5 max-w-5xl mx-auto relative z-10"
                    style={{ paddingTop: `${headerHeight + 16}px` }}
                >
                    {showBackButton && (
                        <div className="mb-4 min-h-[48px] flex items-center">
                            {(isPageLoading || loadingData) ? (
                                <div className="flex items-center gap-2 py-2 px-1">
                                    <Shimmer className="w-8 h-8 rounded-full" />
                                    <Shimmer className="h-5 w-16 rounded-md" />
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-2 px-1 group shimmer-premium"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors ring-1 ring-slate-200 dark:ring-slate-700">
                                        <ChevronLeft size={20} />
                                    </div>
                                    <span className="font-semibold text-sm">Voltar</span>
                                </button>
                            )}
                        </div>
                    )}
                    <Outlet />
                </main>
            </div>

            {/* Hide Sidebar when loading or MFA verification is pending */}
            {!loading && mfaRequired === false && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isPinned={isPinned}
                    onTogglePin={togglePin}
                />
            )}
            <SOSMonitor />
            <SOSPatientFeedback />
        </div>
    );
};

export default Layout;
