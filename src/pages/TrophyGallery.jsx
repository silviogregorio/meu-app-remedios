import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext exists
import { AchievementService } from '../services/achievementService';
import { Trophy, Star, Shield, Activity, Sunrise, Footprints, Lock } from 'lucide-react';
import Shimmer from '../components/ui/Shimmer';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/layout/Header';

// Map icon names to Lucide components
const ICON_MAP = {
    star: Star,
    shield: Shield,
    activity: Activity,
    sunrise: Sunrise,
    footsteps: Footprints,
    default: Trophy
};

const TrophyGallery = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            // Promise.all to ensure at least 1000ms delay and data fetch
            const [data] = await Promise.all([
                AchievementService.getAchievements(user.id).catch(err => {
                    console.error('Failed to load achievements', err);
                    return [];
                }),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);
            setAchievements(data);
            setLoading(false);
        };

        loadData();
    }, [user]);

    const totalPoints = achievements.reduce((acc, curr) => curr.isUnlocked ? acc + curr.points : acc, 0);
    const completedCount = achievements.filter(a => a.isUnlocked).length;
    const progress = achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Galeria de Troféus" />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {loading ? (
                        <div className="animate-pulse space-y-8">
                            {/* Hero Skeleton */}
                            <div className="h-64 rounded-2xl bg-gray-200 dark:bg-slate-800 w-full relative overflow-hidden">
                                <Shimmer className="absolute inset-0 w-full h-full" />
                            </div>

                            {/* Progress Skeleton */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Shimmer className="h-4 w-32 rounded" />
                                    <Shimmer className="h-4 w-40 rounded" />
                                </div>
                                <Shimmer className="h-4 w-full rounded-full" />
                            </div>

                            {/* Grid Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 relative overflow-hidden">
                                        <Shimmer className="absolute inset-0 w-full h-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Hero Section */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-xl mb-8">
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">Sua Jornada de Saúde</h2>
                                        <p className="text-indigo-100 max-w-md">
                                            Continue cuidando de você para desbloquear novas conquistas e subir de nível!
                                        </p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
                                        <Trophy size={40} className="text-yellow-300" />
                                        <div>
                                            <p className="text-sm text-indigo-200">Total de Pontos</p>
                                            <p className="text-3xl font-bold">{totalPoints}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Circles */}
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-8">
                                <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    <span>Progresso Geral</span>
                                    <span>{completedCount} de {achievements.length} Conquistas</span>
                                </div>
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-1000 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {achievements.map((badge) => {
                                    const Icon = ICON_MAP[badge.icon] || ICON_MAP.default;
                                    return (
                                        <div
                                            key={badge.id}
                                            className={`
                                                relative overflow-hidden rounded-xl p-6 transition-all duration-300 border
                                                ${badge.isUnlocked
                                                    ? 'bg-white dark:bg-slate-800 border-yellow-200 dark:border-yellow-900/30 shadow-lg hover:-translate-y-1'
                                                    : 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 grayscale opacity-80'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-full ${badge.isUnlocked ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-200 text-gray-500'}`}>
                                                    <Icon size={28} />
                                                </div>
                                                {badge.isUnlocked && (
                                                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                        Conquistado
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{badge.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-10 line-clamp-2">
                                                {badge.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                    <Trophy size={12} />
                                                    {badge.points} pts
                                                </span>
                                                {!badge.isUnlocked && (
                                                    <Lock size={16} className="text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TrophyGallery;
