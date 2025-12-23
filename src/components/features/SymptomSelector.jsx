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
    ChevronLeft
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

const SymptomSelector = ({ onCancel }) => {
    const { logSymptom } = useApp();
    const [selectedSymptom, setSelectedSymptom] = useState(null);
    const [intensity, setIntensity] = useState(3);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedSymptom) return;
        setLoading(true);
        try {
            await logSymptom({
                symptom: selectedSymptom.label,
                intensity: intensity,
                notes: notes
            });
            // Reset or Close
            setSelectedSymptom(null);
            setIntensity(3);
            setNotes('');
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
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 px-1 text-sm">O que você está sentindo?</h3>
                    <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2 flex-1">
                        {INITIAL_SYMPTOMS.map((symptom) => (
                            <button
                                key={symptom.id}
                                onClick={() => setSelectedSymptom(symptom)}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-95 text-center gap-2 group h-full min-h-[100px]"
                            >
                                <div className={`p-2.5 rounded-full bg-white dark:bg-slate-900 shadow-sm ${symptom.color} group-hover:scale-110 transition-transform`}>
                                    <symptom.icon size={28} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{symptom.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => setSelectedSymptom(null)}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft size={24} className="text-slate-400" />
                        </button>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                            {selectedSymptom.label}
                        </h3>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-500">Intensidade</label>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getIntensityColor(intensity)}`}>
                                {getIntensityLabel(intensity)}
                            </span>
                        </div>
                        <input
                            type="range"
                            id="symptom-intensity"
                            name="intensity"
                            min="1"
                            max="5"
                            step="1"
                            value={intensity}
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between px-1 mt-1">
                            <span className="text-[10px] text-slate-400">Leve</span>
                            <span className="text-[10px] text-slate-400">Intenso</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="symptom-notes" className="text-sm font-medium text-slate-500 mb-2 block">Observações (Opcional)</label>
                        <textarea
                            id="symptom-notes"
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Começou após o almoço..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder:text-slate-400 dark:text-white"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedSymptom(null)}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Activity className="animate-spin" size={20} /> : 'Salvar Sintoma'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomSelector;
