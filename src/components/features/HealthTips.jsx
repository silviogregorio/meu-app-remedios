import React, { useState, useEffect } from 'react';
import Card, { CardContent } from '../ui/Card';
import { Lightbulb, ChevronLeft, ChevronRight, BookOpen, Heart, Activity, PlusCircle, Shield, Home, Droplet, Sun, Clipboard, Moon, Apple, AlertTriangle, User, Info, Coffee, Smile, Edit3, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Map icon types to Lucide components
const iconMap = {
    Lightbulb: <Lightbulb className="text-amber-500" />,
    BookOpen: <BookOpen className="text-blue-500" />,
    Droplet: <Droplet className="text-blue-400" />,
    PlusCircle: <PlusCircle className="text-emerald-500" />,
    Heart: <Heart className="text-rose-500" />,
    Shield: <Shield className="text-indigo-500" />,
    Home: <Home className="text-slate-500" />,
    Sun: <Sun className="text-amber-400" />,
    Clipboard: <Clipboard className="text-slate-400" />,
    Moon: <Moon className="text-indigo-400" />,
    Apple: <Apple className="text-rose-400" />,
    Activity: <Activity className="text-emerald-400" />,
    AlertTriangle: <AlertTriangle className="text-red-500" />,
    User: <User className="text-blue-500" />,
    Info: <Info className="text-blue-400" />,
    Fruit: <Apple className="text-orange-400" />, // Fallback for Fruit
    Edit3: <Edit3 className="text-slate-400" />,
    Trash2: <Trash2 className="text-slate-500" />,
    Coffee: <Coffee className="text-amber-700" />,
    Smile: <Smile className="text-emerald-500" />
};

const HealthTips = ({ autoRotateInterval = 0, variant = 'default' }) => {
    const [tips, setTips] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const { data, error } = await supabase
                    .from('health_tips')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setTips(data);
                    // Lógica para Dica do Dia: usar a data como seed
                    const today = new Date();
                    const seed = today.getFullYear() + today.getMonth() + today.getDate();
                    setCurrentIndex(seed % data.length);
                }
            } catch (err) {
                console.error('Erro ao buscar dicas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTips();
    }, []);

    useEffect(() => {
        if (autoRotateInterval > 0 && tips.length > 0) {
            const interval = setInterval(() => {
                nextTip();
            }, autoRotateInterval);
            return () => clearInterval(interval);
        }
    }, [autoRotateInterval, tips.length, currentIndex]);

    const nextTip = () => {
        if (tips.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % tips.length);
    };

    const prevTip = () => {
        if (tips.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
    };

    if (loading || tips.length === 0) return null;

    const currentTip = tips[currentIndex];
    const IconComponent = iconMap[currentTip.icon_type] || <Lightbulb className="text-amber-500" />;

    if (variant === 'landing') {
        return (
            <div className="w-full max-w-7xl mx-auto px-0 md:px-4 py-2 md:py-8">
                <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_rgba(59,130,246,0.1)] group">
                    <div className="p-3 pt-5 md:p-10 relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        {/* Left Side: Icon with animated background */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-20 animate-pulse-slow"></div>
                            <div className="relative z-10 p-3 bg-white rounded-3xl shadow-xl border border-blue-50 transform group-hover:scale-110 transition-transform duration-700">
                                {React.cloneElement(IconComponent, { size: 36 })}
                            </div>
                        </div>

                        {/* Middle Side: Content */}
                        <div className="flex-1 text-center md:text-left min-w-0 px-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-3 border border-blue-100">
                                <Sparkles className="w-3 h-3 animate-pulse" />
                                {currentTip.category || 'Dica do Dia'}
                            </div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                                {currentTip.title}
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                "{currentTip.content}"
                            </p>
                        </div>

                        {/* Right Side: Navigation controls */}
                        <div className="flex md:flex-col gap-3">
                            <button
                                onClick={prevTip}
                                className="p-4 bg-white/80 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95 group/btn"
                                title="Anterior"
                            >
                                <ChevronLeft className="text-slate-400 group-hover/btn:text-blue-600 transition-colors" size={24} />
                            </button>
                            <button
                                onClick={nextTip}
                                className="p-4 bg-white/80 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95 group/btn"
                                title="Próxima"
                            >
                                <ChevronRight className="text-slate-400 group-hover/btn:text-blue-600 transition-colors" size={24} />
                            </button>
                        </div>
                    </div>
                    {/* Background Shimmer */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-shimmer"></div>
                </div>
            </div>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100/50 shadow-sm relative overflow-hidden group">
            <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-start gap-0 sm:gap-4">
                    <div className="hidden sm:block p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500 border border-blue-50">
                        {IconComponent}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                                {currentTip.category || 'Dica do Dia'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevTip}
                                    className="p-2 bg-white/80 hover:bg-white text-slate-600 rounded-full transition-all shadow-sm border border-slate-100 active:scale-90"
                                    title="Anterior"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={nextTip}
                                    className="p-2 bg-white/80 hover:bg-white text-slate-600 rounded-full transition-all shadow-sm border border-slate-100 active:scale-90"
                                    title="Próxima"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-900 border-none">{currentTip.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                            {currentTip.content}
                        </p>
                    </div>
                </div>
            </CardContent>
            {/* Decoration */}
            {/* Decoration - Adjusted for better responsive view */}
            <div className="absolute -bottom-6 -right-6 p-4 opacity-[0.03] pointer-events-none transform -rotate-12">
                <Lightbulb size={140} />
            </div>
        </Card>
    );
};

export default HealthTips;
