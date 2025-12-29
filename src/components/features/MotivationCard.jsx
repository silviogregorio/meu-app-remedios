import React, { useState, useEffect } from 'react';
import { Quote, Volume2, VolumeX, Sun, Cloud, Moon, Lightbulb, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRandomBatch } from '../../data/quotesReserve';
import clsx from 'clsx';

const MotivationCard = () => {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [period, setPeriod] = useState('');

    const categoryTranslations = {
        faith: 'Fé',
        health: 'Saúde',
        motivation: 'Força',
        inspiration: 'Inspiração'
    };

    useEffect(() => {
        const hour = new Date().getHours();
        let currentPeriod = 'morning';
        if (hour >= 12 && hour < 18) currentPeriod = 'afternoon';
        else if (hour >= 18 || hour < 5) currentPeriod = 'night';

        setPeriod(currentPeriod);
        fetchMessage(currentPeriod);

        // Cleanup speech on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const fetchMessage = async (currentPeriod, scale = 0) => {
        if (scale > 1) { // Safety break
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const cached = localStorage.getItem('daily_motivation');
            const cachedTime = localStorage.getItem('daily_motivation_time');
            const cachedPeriod = localStorage.getItem('daily_motivation_period');

            // Cache validation: Same period, less than 4 hours old
            if (cached && cachedPeriod === currentPeriod && cachedTime) {
                const age = new Date().getTime() - Number(cachedTime);
                if (age < 1000 * 60 * 60 * 4) { // 4 hours
                    setMessage(JSON.parse(cached));
                    setLoading(false);
                    return;
                }
            }

            // Fetch from DB using RPC (Smart Logic)
            const { data, error } = await supabase.rpc('get_daily_motivation', {
                p_period: currentPeriod
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const msg = data[0];
                setMessage(msg);

                // Mark as seen immediately
                await supabase.from('user_seen_messages').upsert(
                    { user_id: (await supabase.auth.getUser()).data.user?.id, message_id: msg.id, seen_at: new Date() },
                    { onConflict: 'user_id,message_id' }
                );

                // Update Cache
                localStorage.setItem('daily_motivation', JSON.stringify(msg));
                localStorage.setItem('daily_motivation_time', new Date().getTime());
                localStorage.setItem('daily_motivation_period', currentPeriod);
            } else {
                // EMPTY DATA -> TRIGGER REFILL
                console.log('Motivation Bank Empty! Refilling...');
                const newBatch = getRandomBatch(5);

                // Insert new batch with is_active: true
                const { error: insertError } = await supabase
                    .from('motivation_messages')
                    .upsert(newBatch.map(m => ({ ...m, is_active: true })), { onConflict: 'text', ignoreDuplicates: true });

                if (!insertError) {
                    // Refetch recursively (scale + 1)
                    fetchMessage(currentPeriod, scale + 1);
                    return;
                } else {
                    console.error("Refill failed", insertError);
                }
            }
        } catch (err) {
            console.error('Error fetching motivation:', err);
            // Fallback UI
            setMessage({ text: "Sua saúde é seu maior bem. Cuide-se com carinho.", category: "saúde" });
        } finally {
            setLoading(false);
        }
    };

    const handleSpeak = () => {
        if (!message) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = 'pt-BR';

        // Voz feminina suave e tranquila
        utterance.rate = 0.85; // Mais devagar para maior clareza
        utterance.pitch = 0.9; // Pitch mais suave e feminino
        utterance.volume = 1.0; // Volume pleno

        // Tentar usar voz feminina do sistema
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v =>
            v.lang.includes('pt-BR') && v.name.toLowerCase().includes('female')
        ) || voices.find(v =>
            v.lang.includes('pt-BR') && (v.name.includes('Luciana') || v.name.includes('Google'))
        );

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    if (loading) {
        return (
            <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 animate-pulse mb-4">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
        );
    }
    if (!message) return null;

    // Theme Config based on period with gradients
    const themes = {
        morning: {
            gradient: 'from-amber-50 via-orange-50 to-yellow-50',
            border: 'border-amber-200/50',
            iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
            text: 'text-amber-900',
            textSecondary: 'text-amber-700',
            badge: 'bg-amber-100 text-amber-700',
            Icon: Sun,
            greeting: 'Bom Dia'
        },
        afternoon: {
            gradient: 'from-sky-50 via-blue-50 to-cyan-50',
            border: 'border-sky-200/50',
            iconBg: 'bg-gradient-to-br from-sky-400 to-blue-500',
            text: 'text-sky-900',
            textSecondary: 'text-sky-700',
            badge: 'bg-sky-100 text-sky-700',
            Icon: Cloud,
            greeting: 'Boa Tarde'
        },
        night: {
            gradient: 'from-violet-50 via-purple-50 to-indigo-50',
            border: 'border-violet-200/50',
            iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
            text: 'text-violet-900',
            textSecondary: 'text-violet-700',
            badge: 'bg-violet-100 text-violet-700',
            Icon: Moon,
            greeting: 'Boa Noite'
        }
    };

    const theme = themes[period] || themes.morning;
    const PeriodIcon = theme.Icon;

    return (
        <div className={clsx(
            "rounded-2xl p-5 bg-gradient-to-br border relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4 shadow-sm hover:shadow-md mb-4",
            theme.gradient,
            theme.border
        )}>
            {/* Background Decorations */}
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/30 blur-xl"></div>

            <div className="relative z-10">
                {/* Header with Icon and Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0",
                            theme.iconBg
                        )}>
                            <PeriodIcon size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className={clsx("text-xs font-bold uppercase tracking-widest opacity-80 block", theme.textSecondary)}>
                                {theme.greeting} • {categoryTranslations[message.category] || message.category || 'Inspiração'}
                            </span>
                        </div>
                    </div>

                    {/* Audio Button */}
                    <button
                        onClick={handleSpeak}
                        className={clsx(
                            "p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0",
                            isPlaying
                                ? "bg-red-100 text-red-600 scale-105"
                                : "bg-white/70 hover:bg-white text-slate-500 hover:text-slate-700"
                        )}
                        title={isPlaying ? "Parar leitura" : "Ouvir mensagem"}
                    >
                        {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {/* Content Section */}
                <div className="space-y-2">
                    {/* Message Title (if exists) */}
                    {message.title && (
                        <h3 className={clsx("font-black text-xl leading-snug", theme.text)}>
                            {message.title}
                        </h3>
                    )}

                    {/* Main Message */}
                    <p className={clsx("text-lg md:text-xl font-bold leading-relaxed italic break-words", theme.text)}>
                        "{message.text}"
                    </p>
                </div>

                {/* Subtle Navigation Visual (Optional) */}
                <div className="flex justify-end mt-4 opacity-10 gap-2">
                    <ChevronLeft size={16} />
                    <ChevronRight size={16} />
                </div>
            </div>
        </div>
    );
};

export default MotivationCard;
