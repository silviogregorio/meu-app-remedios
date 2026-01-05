import React from 'react';

const LoadingScreen = ({ text = "Carregando...", fullScreen = true }) => {
    const containerClass = fullScreen
        ? "fixed inset-0 z-[9999] bg-white dark:bg-slate-900"
        : "w-full min-h-[400px] bg-transparent";

    return (
        <div className={`${containerClass} flex items-center justify-center animate-in fade-in duration-300`}>
            <div className="flex flex-col items-center gap-8">
                <div className="relative flex items-center justify-center">
                    {/* Pulsing Background Circles */}
                    <div className="absolute w-32 h-32 bg-blue-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] delay-150"></div>

                    {/* Logo Container - Blue Border & Glow */}
                    <div className="relative z-10 p-5 bg-white dark:bg-slate-800 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-500/30 dark:border-blue-400/30 backdrop-blur-sm">
                        <img
                            src="/assets/logo.png"
                            alt="Carregando..."
                            className="w-16 h-16 object-contain animate-heartbeat"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 animate-pulse">
                    <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">SiG Remédios</p>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{text}</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
