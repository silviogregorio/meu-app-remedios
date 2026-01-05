import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center z-50">
            <div className="relative flex items-center justify-center">
                {/* Subtle Pulse Background */}
                <div className="absolute w-24 h-24 bg-blue-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

                {/* Logo */}
                <div className="relative z-10 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <img
                        src="/assets/logo.png"
                        alt="Loading..."
                        className="w-12 h-12 object-contain animate-pulse"
                    />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
