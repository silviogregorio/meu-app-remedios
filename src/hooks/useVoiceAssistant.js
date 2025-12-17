import { useState, useEffect, useCallback } from 'react';

export const useVoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Text-to-Speech (TTS)
    const speak = useCallback((text) => {
        if (!('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; // Brazilian Portuguese
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    // Helper to stop speaking
    const cancelSpeech = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Speech-to-Text (STT) - Web Speech API
    // Note: This requires browser support (Chrome/Edge/Safari)
    const startListening = useCallback((onCommand) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            console.log('Voice Command:', transcript);

            // Simple command parsing
            if (transcript.includes('tomei') || transcript.includes('marcar') || transcript.includes('feito')) {
                onCommand?.('take');
            } else if (transcript.includes('ajuda') || transcript.includes('socorro')) {
                onCommand?.('help');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, []);

    return {
        speak,
        cancelSpeech,
        isSpeaking,
        startListening,
        isListening,
        lastTranscript
    };
};
