import React, { useState } from 'react';
import {
    Frown,
    Thermometer,
    Zap,
    Brain,
    Archive,
    Activity,
    Coffee,
    AlertCircle,
    Meh,
    Smile,
    HeartPulse,
    ChevronLeft,
    Search,
    User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const INITIAL_SYMPTOMS = [
    { id: 'headache', label: 'Dor de Cabeça', icon: Brain, color: 'text-indigo-500' },
    { id: 'nausea', label: 'Enjoo', icon: Frown, color: 'text-green-500' },
    { id: 'dizziness', label: 'Tontura', icon: Activity, color: 'text-purple-500' },
    { id: 'fatigue', label: 'Cansaço', icon: Coffee, color: 'text-amber-700' },
    { id: 'fever', label: 'Febre', icon: Thermometer, color: 'text-red-500' },
    { id: 'pain', label: 'Dor no Corpo', icon: Zap, color: 'text-orange-500' },
    { id: 'cramps', label: 'Cólicas', icon: AlertCircle, color: 'text-pink-500' },
    { id: 'palpitation', label: 'Palpitação', icon: HeartPulse, color: 'text-red-600' }
];

const SymptomSelector = ({ onCancel, initialPatientId }) => {
    const { logSymptom, patients, showToast } = useApp();
    const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId && initialPatientId !== 'all' ? initialPatientId : '');
    const [selectedSymptom, setSelectedSymptom] = useState(null);
    const [intensity, setIntensity] = useState(3);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados de Busca de Paciente
    const [patientSearch, setPatientSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Efeito para preencher o nome do paciente se houver um ID inicial
    React.useEffect(() => {
        if (initialPatientId && initialPatientId !== 'all' && patients.length > 0) {
            const patient = patients.find(p => p.id === initialPatientId);
            if (patient) {
                setPatientSearch(patient.name);
            }
        }
    }, [initialPatientId, patients]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const selectedPatientName = patients.find(p => p.id === selectedPatientId)?.name || 'Selecione o paciente...';

    const handleSave = async () => {
        if (!selectedSymptom) return;
        if (!selectedPatientId) {
            showToast('Por favor, selecione o paciente.', 'error');
            return;
        }

        setLoading(true);
        try {
            await logSymptom({
                patient_id: selectedPatientId,
                symptom: selectedSymptom.label,
                intensity: intensity,
                notes: notes
            });
            // Reset or Close
            setSelectedSymptom(null);
            setIntensity(3);
            setNotes('');
            // Se o initialPatientId era 'all', limpamos a seleção para o próximo registro
            if (!initialPatientId || initialPatientId === 'all') {
                setSelectedPatientId('');
                setPatientSearch('');
            }
            if (onCancel) onCancel();
        } finally {
            setLoading(false);
        }
    };

    const getIntensityLabel = (val) => {
        if (val === 1) return 'Leve';
        if (val === 2) return 'Incômodo';
        if (val === 3) return 'Moderado';
        if (val === 4) return 'Forte';
        if (val === 5) return 'Insuportável';
        return '';
    };

    const getIntensityColor = (val) => {
        if (val <= 2) return 'bg-green-100 text-green-700';
        if (val <= 3) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 h-full flex flex-col">
            {!selectedSymptom ? (
                <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 px-1 text-sm">O que você está sentindo? Clique e relate.</h3>
                    <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2 flex-1">
                        {INITIAL_SYMPTOMS.map((symptom) => (
                            <button
                                key={symptom.id}
                                onClick={() => setSelectedSymptom(symptom)}
                                className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition-all active:scale-95 text-center gap-2 group min-h-[90px] shadow-sm hover:shadow-md hover:shadow-indigo-100/20"
                            >
                                <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-900 ${symptom.color} group-hover:scale-110 transition-transform`}>
                                    <symptom.icon size={22} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200 leading-tight uppercase tracking-tight">{symptom.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => setSelectedSymptom(null)}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 ${selectedSymptom.color}`}>
                                <selectedSymptom.icon size={18} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {selectedSymptom.label}
                            </h3>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {/* Seleção de Paciente com Busca */}
                        <div className="relative">
                            <label className="text-[11px] font-bold text-slate-400 mb-2 block uppercase tracking-wider">Paciente sendo atendido</label>

                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setIsSearching(true);
                                    }}
                                    onFocus={() => setIsSearching(true)}
                                />
                                {isSearching && (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map(p => (
                                                <button
                                                    key={p.id}
                                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 last:border-0 ${selectedPatientId === p.id ? 'bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                                                    onClick={() => {
                                                        setSelectedPatientId(p.id);
                                                        setPatientSearch(p.name);
                                                        setIsSearching(false);
                                                    }}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${selectedPatientId === p.id ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-900'}`}>
                                                        <User size={14} />
                                                    </div>
                                                    {p.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-slate-400 text-xs">
                                                Nenhum paciente encontrado.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isSearching && <div className="fixed inset-0 z-10" onClick={() => setIsSearching(false)} />}
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Intensidade do Sintoma</label>
                                <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full ${getIntensityColor(intensity)} uppercase`}>
                                    {getIntensityLabel(intensity)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={intensity}
                                onChange={(e) => setIntensity(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between px-1 mt-1">
                                <span className="text-[10px] text-slate-400">Leve</span>
                                <span className="text-[10px] text-slate-400">Grave</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 mb-2 block uppercase tracking-wider">Observações adicionais</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Descreva brevemente como se sente..."
                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans placeholder:text-slate-400 dark:text-white"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <button
                            onClick={() => setSelectedSymptom(null)}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-[2] py-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? <Activity className="animate-spin" size={18} /> : 'Registrar Agora'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomSelector;
