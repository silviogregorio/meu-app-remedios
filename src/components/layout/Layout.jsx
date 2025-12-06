import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../ui/Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
            {/* Gradient decorations in corners */}
            <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/50 via-emerald-50/25 to-transparent rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-50/40 via-emerald-50/20 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-50/45 via-teal-50/25 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="pt-[80px] px-4 pb-8 max-w-3xl mx-auto relative z-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
