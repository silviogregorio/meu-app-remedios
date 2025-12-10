import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceCommand = ({ schedule, onToggle }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true);
        }
    }, []);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Comando ouvido:', transcript);
            processCommand(transcript);
        };

        recognition.start();
    };

    const processCommand = (text) => {
        setProcessing(true);

        // Remove keywords to isolate medication name
        // Ex: "marcar dipirona como tomado", "tomei losartana", "registrar xarope"
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

        console.log('Nome do remédio extraído:', cleanText);

        if (cleanText.length < 3) {
            alert('Não entendi qual é o remédio. Tente dizer "Tomar [Nome do Remédio]".');
            setProcessing(false);
            return;
        }

        // Fuzzy search in today's pending schedule
        const pendingItems = schedule.filter(item => !item.isTaken);

        // 1. Direct includes match
        let match = pendingItems.find(item =>
            item.medicationName.toLowerCase().includes(cleanText)
        );

        if (match) {
            const confirmAction = window.confirm(`Entendi "${match.medicationName}". Marcar como tomado agora?`);
            if (confirmAction) {
                onToggle(match);
            }
        } else {
            alert(`Não encontrei nenhum remédio pendente com o nome "${cleanText}" para hoje.`);
        }

        setProcessing(false);
    };

    if (!isSupported) return null;

    return (
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
            title="Comando de Voz: Diga 'Tomar dipirona'"
        >
            {processing ? (
                <Loader2 className="animate-spin" size={24} />
            ) : isListening ? (
                <MicOff size={24} />
            ) : (
                <Mic size={24} />
            )}
        </button>
    );
};

export default VoiceCommand;
