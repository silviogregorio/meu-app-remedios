import React from 'react';
import { Pill } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center z-50 transition-opacity duration-300">
            <div className="relative">
                {/* Glow/Blur Behind */}
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>

                {/* Icon Container */}
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <Pill size={48} className="text-blue-600 dark:text-blue-400 animate-bounce" />
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
                <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-1/2 animate-[shimmer_1s_infinite_linear] text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/30 skew-x-12 animate-[spin_1s_linear_infinite]"></div>
                    </div>
                    {/* Simple indeterminate bar using standard tailwind if custom anims missing */}
                    <div className="h-full bg-blue-500 animate-pulse w-full origin-left bg-gradient-to-r from-blue-400 to-blue-600"></div>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
