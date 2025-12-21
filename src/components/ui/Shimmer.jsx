import React from 'react';

const Shimmer = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] shimmer ${className}`}>
        </div>
    );
};

// Shimmer for medication card
export const MedicationCardShimmer = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
                {/* Icon shimmer */}
                <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />

                <div className="flex-1 space-y-3">
                    {/* Title shimmer */}
                    <Shimmer className="h-5 w-3/4 rounded" />

                    {/* Info shimmers */}
                    <div className="space-y-2">
                        <Shimmer className="h-4 w-1/2 rounded" />
                        <Shimmer className="h-4 w-2/3 rounded" />
                    </div>

                    {/* Button shimmer */}
                    <Shimmer className="h-9 w-full rounded-lg mt-3" />
                </div>
            </div>
        </div>
    );
};

// Shimmer for patient card
export const PatientCardShimmer = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
                <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Shimmer className="h-5 w-1/2 rounded" />
                    <Shimmer className="h-4 w-1/3 rounded" />
                </div>
            </div>
            <Shimmer className="h-4 w-full rounded mb-2" />
            <Shimmer className="h-4 w-2/3 rounded" />
        </div>
    );
};

// Shimmer for hero card (next dose/all done)
export const HeroCardShimmer = () => {
    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-xl rounded-2xl p-6">
            <div className="space-y-4">
                <div className="h-6 w-32 rounded shimmer-dark"></div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl shimmer-dark"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-8 w-3/4 rounded shimmer-dark"></div>
                        <div className="h-6 w-1/2 rounded shimmer-dark"></div>
                    </div>
                </div>
                <div className="h-10 w-full rounded-lg shimmer-dark"></div>
            </div>
        </div>
    );
};

// Shimmer for stats/energy card
export const StatsCardShimmer = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Shimmer className="h-5 w-24 rounded" />
                    <Shimmer className="h-6 w-12 rounded" />
                </div>
                <Shimmer className="h-2 w-full rounded-full" />
                <Shimmer className="h-16 w-full rounded-lg" />
            </div>
        </div>
    );
};

export default Shimmer;
