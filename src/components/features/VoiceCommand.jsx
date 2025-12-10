import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceCommand = ({ schedule, onToggle }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmMatch, setConfirmMatch] = useState(null); // { item, text }
    const [feedback, setFeedback] = useState(null); // { type: 'error'|'info', message: '' }

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

    const startListening = () => {
        setFeedback(null);
        setConfirmMatch(null);

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

        const cleanText = text
            .replace(/marcar/g, '')
            .replace(/como/g, '')
            .replace(/tomado/g, '')
            .replace(/tomei/g, '')
            .replace(/tomar/g, '')
            .replace(/registrar/g, '')
            .replace(/o/g, '')
            .replace(/a/g, '')
            .trim();

        if (cleanText.length < 3) {
            setFeedback({ type: 'error', message: `Ouvi "${text}", mas não reconheci o remédio.` });
            setProcessing(false);
            return;
        }

        const pendingItems = schedule.filter(item => !item.isTaken);

        // 1. Exact/Substring Match (Priority)
        let match = pendingItems.find(item =>
            item.medicationName.toLowerCase().includes(cleanText)
        );

        // 2. Fuzzy Match (Fallback)
        if (!match) {
            match = pendingItems.find(item => {
                const medName = item.medicationName.toLowerCase();
                const dist = levenshtein(medName, cleanText);
                // Allow error of 3 chars or 30% length difference
                return dist <= 3 || dist < medName.length * 0.4;
            });
        }

        if (match) {
            setConfirmMatch(match);
        } else {
            console.log('Falha ao encontrar:', cleanText); // Debug
            setFeedback({ type: 'error', message: `Não achei "${cleanText}" (ou parecido) para hoje.` });
        }

        setProcessing(false);
    };

    const handleConfirm = () => {
        if (confirmMatch) {
            onToggle(confirmMatch);
            setFeedback({ type: 'success', message: `Marcado: ${confirmMatch.medicationName}` });
            setConfirmMatch(null);
        }
    };

    if (!isSupported) return null;

    return (
        <>
            {/* Feedback / Confirmation UI */}
            {(confirmMatch || feedback) && (
                <div className="fixed bottom-40 right-4 z-50 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-5">
                    {confirmMatch ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Entendi:</p>
                            <p className="font-bold text-lg text-slate-800 dark:text-white">
                                {confirmMatch.medicationName} ({confirmMatch.dosage})
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

            {/* Mic Button */}
            <button
                onClick={startListening}
                disabled={isListening || processing}
                className={`
                    fixed bottom-24 right-4 z-40 
                    w-14 h-14 rounded-full shadow-xl 
                    flex items-center justify-center 
                    transition-all duration-300
                    ${isListening
                        ? 'bg-red-500 animate-pulse scale-110'
                        : 'bg-primary hover:bg-primary-dark'
                    }
                    text-white
                `}
                title="Comando de Voz"
            >
                {processing ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : isListening ? (
                    <MicOff size={24} />
                ) : (
                    <Mic size={24} />
                )}
            </button>
        </>
    );
};

export default VoiceCommand;
