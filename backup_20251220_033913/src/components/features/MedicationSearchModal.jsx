import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Mic, MicOff, ExternalLink, ShieldAlert, PlusCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MedicationSearchModal = ({ isOpen, onClose, onAddToSchedule }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        const searchMedications = async () => {
            const cleanQuery = query.trim();
            if (cleanQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Using Full Text Search on the vector column or simple ILIKE
                const { data, error } = await supabase
                    .from('medication_library')
                    .select('*')
                    .ilike('name', `%${cleanQuery}%`)
                    .limit(5);

                if (error) throw error;
                setResults(data || []);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchMedications, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Voice Logic (Simplified)
    const toggleVoice = () => {
        if (isListening) {
            window.speechSynthesis.cancel(); // Paranoia check
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Seu navegador não suporta voz.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.replace(/[.,]/g, '');
            setQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
    };

    const handleExternalSearch = () => {
        // Safe search on Anvisa or Trusted Google Context
        const url = `https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(query)}`;
        // Fallback to Google if Anvisa is too complex/slow?
        // Let's use Google filtered for safety for now as Anvisa deep links change often.
        const safeUrl = `https://www.google.com/search?q=bula+${encodeURIComponent(query)}+anvisa`;
        window.open(safeUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header Search Bar */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                    <Search className="text-slate-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nome do medicamento..."
                        className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-300"
                    />
                    <button
                        onClick={toggleVoice}
                        className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto p-4 bg-slate-50 flex-1">

                    {/* Zero State */}
                    {query.length < 2 && (
                        <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                            <Search size={48} className="opacity-20 mb-4" />
                            <p>Digite ou fale o nome do remédio</p>
                            <p className="text-xs mt-2 opacity-60">Busca segura na nossa biblioteca verificada.</p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}

                    {/* Results List */}
                    {!loading && query.length >= 2 && results.map(med => (
                        <div key={med.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-slate-800">{med.name}</h3>
                                {onAddToSchedule && (
                                    <button
                                        onClick={() => onAddToSchedule(med.name)}
                                        className="text-primary hover:bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-1"
                                    >
                                        <PlusCircle size={14} /> Usar
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 text-sm text-slate-600">
                                {med.description && (
                                    <p><strong className="text-slate-900">O que é:</strong> {med.description}</p>
                                )}
                                {med.indications && (
                                    <p><strong className="text-slate-900">Indicações:</strong> {med.indications}</p>
                                )}

                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3 items-start mt-2">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                    <div className="text-xs text-amber-900">
                                        <strong>Cuidados:</strong> {med.warnings || "Consulte sempre seu médico."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Fallback / Not Found */}
                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center">
                            <p className="text-slate-600 mb-2 font-medium">Não encontrado na nossa biblioteca simplificada.</p>
                            <p className="text-xs text-slate-500 mb-4">Para sua segurança, não inventamos informações.</p>

                            <button
                                onClick={handleExternalSearch}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <ExternalLink size={16} />
                                Consultar na Anvisa / Google Seguro
                            </button>
                        </div>
                    )}

                    {/* Global Verification Badge */}
                    {!loading && results.length > 0 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-100 px-3 py-1 rounded-full">
                                <ShieldAlert size={12} />
                                Informação Verificada • Não substitui médico
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicationSearchModal;
