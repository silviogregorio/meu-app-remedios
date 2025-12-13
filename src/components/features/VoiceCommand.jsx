import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, CircleHelp } from 'lucide-react';

const VoiceCommand = ({ schedule, onToggle }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmMatch, setConfirmMatch] = useState(null); // { item, text }
    const [feedback, setFeedback] = useState(null); // { type: 'error'|'info', message: '' }
    const [showHelp, setShowHelp] = useState(false); // New state for help

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true);
        }
    }, []);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    // Close help after 10s or when listening starts
    useEffect(() => {
        if (showHelp) {
            const timer = setTimeout(() => setShowHelp(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [showHelp]);

    const startListening = () => {
        setFeedback(null);
        setConfirmMatch(null);
        setShowHelp(false);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setFeedback({ type: 'error', message: 'Permissão de microfone negada.' });
            } else {
                setFeedback({ type: 'error', message: 'Não entendi. Tente novamente.' });
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processCommand(transcript);
        };

        recognition.start();
    };

    // Levenshtein distance for fuzzy matching
    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const processCommand = (text) => {
        setProcessing(true);

        // Remove keywords (whole words only) to isolate medication name
        const stopWords = [
            'marcar', 'desmarcar', 'desmarque', 'como', 'tomado', 'tomei', 'tomar',
            'registrar', 'o', 'a', 'os', 'as', 'um', 'uma', 'que', 'de', 'do', 'da'
        ];

        let cleanText = text;
        stopWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleanText = cleanText.replace(regex, '');
        });

        cleanText = cleanText.trim();

        if (cleanText.length < 3) {
            setFeedback({ type: 'error', message: `Ouvi "${text}", mas não reconheci o remédio.` });
            setProcessing(false);
            return;
        }

        // Search in ALL items (taken or pending)
        // 1. Exact/Substring Match (Priority)
        let match = schedule.find(item =>
            item.medicationName.toLowerCase().includes(cleanText)
        );

        // 2. Fuzzy Match (Fallback)
        if (!match) {
            match = schedule.find(item => {
                const medName = item.medicationName.toLowerCase();
                const dist = levenshtein(medName, cleanText);
                return dist <= 3 || dist < medName.length * 0.4;
            });
        }

        if (match) {
            setConfirmMatch(match);
        } else {
            console.log('Falha ao encontrar:', cleanText);
            setFeedback({ type: 'error', message: `Não achei "${cleanText}" na lista de hoje.` });
        }

        setProcessing(false);
    };

    const handleConfirm = () => {
        if (confirmMatch) {
            onToggle(confirmMatch);
            const action = confirmMatch.isTaken ? 'Desmarcado' : 'Marcado';
            setFeedback({ type: 'success', message: `${action}: ${confirmMatch.medicationName}` });
            setConfirmMatch(null);
        }
    };

    if (!isSupported) return null;

    return (
        <>
            {/* Feedback / Confirmation UI */}
            {(confirmMatch || feedback || showHelp) && (
                <div className="fixed bottom-40 right-4 z-50 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-5">
                    {showHelp ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Mic size={16} className="text-primary" />
                                    Comandos de Voz
                                </h3>
                                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">×</button>
                            </div>
                            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mt-1">
                                <li>👉 <strong>"Tomar [Nome]"</strong></li>
                                <li>👉 <strong>"Marcar [Nome]"</strong></li>
                                <li>👉 <strong>"Desmarcar [Nome]"</strong></li>
                                <li>👉 <strong>"Tomei a [Nome]"</strong></li>
                            </ul>
                            <p className="text-xs text-slate-400 mt-2 italic">Dica: Fale apenas o nome se preferir.</p>
                        </div>
                    ) : confirmMatch ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Entendi:</p>
                            <p className="font-bold text-lg text-slate-800 dark:text-white">
                                {confirmMatch.medicationName} ({confirmMatch.dosage})
                            </p>
                            <p className="text-xs text-slate-500">
                                {confirmMatch.isTaken ? 'Já tomado. Deseja desmarcar?' : 'Marcar como tomado?'}
                            </p>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => setConfirmMatch(null)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:opacity-90"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-2 px-3 rounded-xl bg-green-500 text-white font-bold text-sm shadow-md hover:bg-green-600"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    ) : feedback && (
                        <div className={`text-sm font-medium ${feedback.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                            {feedback.message}
                        </div>
                    )}
                </div>
            )}

            {/* Mic and Help Buttons */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3 items-center">
                {/* Help Button (Mini) */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                    title="Ajuda"
                >
                    <CircleHelp size={20} />
                </button>

                {/* Mic Button (Main) */}
                <button
                    onClick={startListening}
                    disabled={isListening || processing}
                    className={`
                        w-14 h-14 rounded-full shadow-xl 
                        flex items-center justify-center 
                        transition-all duration-300
                        ${isListening
                            ? 'bg-red-500 animate-pulse scale-110'
                            : 'bg-primary hover:bg-primary-dark'
                        }
                        text-white
                    `}
                    title="Fala o que deseja"
                >
                    {processing ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : isListening ? (
                        <MicOff size={24} />
                    ) : (
                        <Mic size={24} />
                    )}
                </button>
            </div>
        </>
    );
};

export default VoiceCommand;
