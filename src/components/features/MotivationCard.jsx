import React, { useState, useEffect } from 'react';
import { Quote, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRandomBatch } from '../../data/quotesReserve';

const MotivationCard = () => {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [period, setPeriod] = useState('');

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
                const msg = data[0]; // RPC returns array inside data if setof? No, returns body.
                // Supabase RPC returns data as the array of rows
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
                // Using upsert with onConflict 'text' to avoid errors if Reserve has duplicates with DB
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
            setMessage({ text: "Sua saúde é seu maior bem. Cuide-se com carinho." });
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
        utterance.rate = 0.9;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    if (loading) return null; // Or skeleton
    if (!message) return null;

    // Theme Config based on period
    const themes = {
        morning: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-500', border: 'border-orange-100' },
        afternoon: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-500', border: 'border-blue-100' },
        night: { bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'text-indigo-500', border: 'border-indigo-100' }
    };

    const theme = themes[period] || themes.morning;

    return (
        <div className={`rounded-xl p-6 ${theme.bg} border ${theme.border} relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 shadow-sm mb-6`}>
            {/* Background Icon Watermark */}
            <Quote className={`absolute -right-2 -top-2 w-24 h-24 ${theme.icon} opacity-5 rotate-12`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.icon} opacity-80 flex items-center gap-1`}>
                        {period === 'morning' && '☀️ Bom dia'}
                        {period === 'afternoon' && '🌤️ Boa tarde'}
                        {period === 'night' && '🌙 Boa noite'} • Inspiração
                    </span>

                    <button
                        onClick={handleSpeak}
                        className={`p-2 rounded-full ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-white/50 hover:bg-white text-slate-600'} transition-colors`}
                        title={isPlaying ? "Parar leitura" : "Ouvir mensagem"}
                    >
                        {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </div>

                <p className={`text-lg md:text-xl font-medium ${theme.text} leading-relaxed font-serif italic`}>
                    "{message.text}"
                </p>
            </div>
        </div>
    );
};

export default MotivationCard;
