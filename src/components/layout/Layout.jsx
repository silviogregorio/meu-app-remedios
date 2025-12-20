import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../ui/Sidebar';

import { useApp } from '../../context/AppContext';
import { setupOnMessageListener } from '../../utils/firebase';

const Layout = () => {
    const { accessibility, showToast } = useApp();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(() => {
        const saved = localStorage.getItem('sidebarPinned');
        return saved === 'true';
    });

    // Use ref to avoid recreating listener when showToast changes
    const showToastRef = useRef(showToast);
    useEffect(() => {
        showToastRef.current = showToast;
    }, [showToast]);

    // Listen for foreground FCM push notifications (continuously)
    // Empty dependency array - set up ONCE and never cleanup until unmount
    useEffect(() => {
        console.log('🔔 Setting up foreground FCM listener (once)...');

        const unsubscribe = setupOnMessageListener((payload) => {
            console.log('🔔 Layout received FCM message:', payload);

            // Extract title and body from notification or data
            const title = payload?.notification?.title || payload?.data?.title || 'SiG Remédios';
            const body = payload?.notification?.body || payload?.data?.body || payload?.data?.message || 'Nova notificação';
            const mapUrl = payload?.data?.mapUrl;

            // PLAY ALERT SOUND for SOS notifications using Web Audio API
            if (payload?.data?.type === 'sos') {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 800; // Hz - Alert tone
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.5;

                    oscillator.start();

                    // Play SOS pattern
                    setTimeout(() => { oscillator.frequency.value = 0; }, 200);
                    setTimeout(() => { oscillator.frequency.value = 800; }, 300);
                    setTimeout(() => { oscillator.frequency.value = 0; }, 500);
                    setTimeout(() => { oscillator.frequency.value = 800; }, 600);
                    setTimeout(() => { oscillator.frequency.value = 0; }, 800);
                    setTimeout(() => { oscillator.stop(); audioContext.close(); }, 1000);

                    console.log('🔊 SOS Alert sound played');
                } catch (e) {
                    console.warn('Audio creation failed:', e);
                }
            }

            // Show in-app toast
            if (payload?.data?.type === 'sos') {
                const pName = payload.data.patientName || 'Alguém';
                const pPhone = payload.data.formattedPhone || payload.data.phone || '(sem telefone)';

                showToastRef.current(
                    `O paciente ${pName}, telefone ${pPhone} está precisando de ajuda URGENTE! Veja detalhes na notificação do celular ou pelo aplicativo.`,
                    'error' // Using 'error' usually gives red color/more attention, or sticky
                );
            } else {
                showToastRef.current(`🔔 ${title}: ${body}`, 'info');
            }

            // AUTO-OPEN MAP REMOVED by user request
            // User wants to see WHO called before opening map
            if (payload?.data?.type === 'sos' && mapUrl && mapUrl !== '/') {
                console.log('🗺️ Map URL available (click execution required):', mapUrl);
            }
        });

        return () => {
            console.log('🔔 Cleaning up foreground FCM listener');
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []); // Empty deps - setup once on mount

    // Listen for BroadcastChannel messages from Service Worker (backup for data-only messages)
    useEffect(() => {
        const channel = new BroadcastChannel('fcm-push-channel');

        channel.onmessage = (event) => {
            console.log('📢 BroadcastChannel message from SW:', event.data);
            if (event.data?.type === 'FCM_PUSH') {
                const { title, body } = event.data;
                showToastRef.current(`🔔 ${title}: ${body}`, 'info');
            }
        };

        console.log('📢 BroadcastChannel listener set up');

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
        <div className={`min-h-screen bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden transition-colors duration-300 ${accessibility?.highContrast ? 'senior-contrast' : ''} ${accessibility?.largeText ? 'senior-text' : ''}`}>
            {/* Gradient decorations in corners */}
            <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/50 via-emerald-50/25 to-transparent rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-50/45 via-teal-50/25 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            {/* Blue Gradient Vignette (Desktop Only) - DOM Inspection Style */}
            <div className="hidden lg:block fixed inset-0 z-[100] pointer-events-none shadow-[inset_0px_0px_25px_rgba(59,130,246,0.8)] dark:shadow-[inset_0px_0px_25px_rgba(30,58,138,0.8)] transition-all duration-500"></div>

            {/* Content Wrapper with Sidebar Offset */}
            <div className={`transition-all duration-300 ease-in-out ${isPinned ? 'md:ml-64' : ''}`}>
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    isPinned={isPinned}
                />

                <main className="pt-[80px] px-4 pb-5 max-w-5xl mx-auto relative z-10">
                    <Outlet />
                </main>
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isPinned={isPinned}
                onTogglePin={togglePin}
            />
        </div>
    );
};

export default Layout;
