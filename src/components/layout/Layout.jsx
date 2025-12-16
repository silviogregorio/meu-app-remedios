import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../ui/Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(() => {
        const saved = localStorage.getItem('sidebarPinned');
        return saved === 'true';
    });

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
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
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
