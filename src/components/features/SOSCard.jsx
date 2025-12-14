import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Heart, AlertTriangle, Phone, Printer, X, Droplet } from 'lucide-react';
import Button from '../ui/Button';

const SOSCard = ({ onClose }) => {
    const { patients, prescriptions, user } = useApp();
    const printRef = useRef();

    // Add class to body when mounted to handle print styles
    useEffect(() => {
        document.body.classList.add('printing-sos');
        return () => {
            document.body.classList.remove('printing-sos');
        };
    }, []);

    // Filter patients explicitly owned by user or shared with high permissions?
    // For SOS, we show ALL accessible patients because the user might be the caregiver looking for info.
    // Ideally, we let the user select WHICH patient is in emergency.
    // If only 1 patient, show it. If multiple, show tabs or list.
    // Let's implement a simple Patient Selector/List.

    const [selectedPatientId, setSelectedPatientId] = React.useState(
        patients.length > 0 ? patients[0].id : null
    );

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    // Filter Active Prescriptions for this patient
    const activePrescriptions = prescriptions.filter(p => {
        if (p.patientId !== selectedPatientId) return false;

        // Continuous Use OR EndDate >= Today
        if (p.continuousUse) return true;

        const today = new Date().toISOString().split('T')[0];
        return p.endDate >= today;
    });

    const handlePrint = () => {
        window.print();
    };

    if (!selectedPatient) return null;

    const content = (
        <div className="sos-portal fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 print:bg-white print:static print:p-0">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative print:shadow-none print:w-full print:max-w-none">

                {/* Header Vermelho de Emergência */}
                <div className="bg-red-600 p-6 text-white flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                <Heart className="text-white fill-white" size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-wider border-2 border-white/30 px-3 py-1 rounded-lg bg-red-700/50 print:border-black print:text-black print:bg-transparent">
                                SOS MÉDICO
                            </h2>
                        </div>
                        <p className="text-red-100 text-sm font-medium mt-1 print:text-slate-600">
                            Apresente esta tela em caso de emergência.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors print:hidden"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible">

                    {/* Patient Selector (if multiple) - Hidden on Print */}
                    {patients.length > 1 && (
                        <div className="flex gap-2 p-4 overflow-x-auto bg-slate-50 border-b border-slate-100 print:hidden">
                            {patients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPatientId(p.id)}
                                    className={`
                                        px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                                        ${selectedPatientId === p.id
                                            ? 'bg-red-600 text-white shadow-md transform scale-105'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-6 space-y-6" ref={printRef}>

                        {/* 1. Patient Info */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-1 leading-tight">
                                    {selectedPatient.name}
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    Nascimento: {selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                                </p>
                            </div>
                            {selectedPatient.bloodType && (
                                <div className="bg-red-50 border-2 border-red-100 px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                                    <Droplet className="text-red-500 mb-1" size={20} fill="currentColor" />
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Tipo</span>
                                    <span className="text-xl font-black text-red-700">{selectedPatient.bloodType}</span>
                                </div>
                            )}
                        </div>

                        {/* 2. WARNINGS (Allergies & Conditions) */}
                        <div className="space-y-3">
                            {selectedPatient.allergies && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <h4 className="font-bold text-amber-800 uppercase text-xs tracking-wider mb-1">Alergias & Intolerâncias</h4>
                                        <p className="font-bold text-amber-900 text-lg leading-snug">
                                            {selectedPatient.allergies}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedPatient.condition && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h4 className="font-bold text-blue-800 uppercase text-xs tracking-wider mb-1">Condição Médica Principal</h4>
                                    <p className="font-bold text-blue-900 text-lg">
                                        {selectedPatient.condition}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 3. Medication List */}
                        <div>
                            <h3 className="font-bold text-slate-900 border-b pb-2 mb-4 flex items-center justify-between">
                                <span>Medicamentos em Uso ({activePrescriptions.length})</span>
                                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Atualizado: {new Date().toLocaleDateString()}</span>
                            </h3>

                            {activePrescriptions.length === 0 ? (
                                <p className="text-slate-400 italic text-center py-4">Nenhum medicamento ativo registrado.</p>
                            ) : (
                                <div className="grid gap-3">
                                    {activePrescriptions.map(presc => {
                                        const med = useApp().medications.find(m => m.id === presc.medicationId);
                                        return (
                                            <div key={presc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {med ? med.name : 'Medicamento Desconhecido'}
                                                        <span className="text-slate-500 font-normal ml-2 text-sm">
                                                            {med?.dosage}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-0.5">
                                                        {presc.frequency}
                                                        {presc.continuousUse && <span className="text-blue-600 font-bold ml-2 text-xs bg-blue-50 px-1.5 rounded">Uso Contínuo</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 4. Contact Info */}
                        <div className="bg-slate-900 text-slate-300 rounded-xl p-4 mt-6 print:bg-slate-100 print:text-black">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 print:text-black">Responsável / Cuidador</h4>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-800 p-2.5 rounded-full print:bg-white print:border">
                                    <UserIcon user={user} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg print:text-black">
                                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                                    </p>
                                    <p className="text-slate-400 text-sm print:text-slate-600">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 print:hidden">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Fechar
                    </Button>
                    <Button
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                        onClick={handlePrint}
                    >
                        <Printer size={18} className="mr-2" />
                        Imprimir / PDF
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

// Helper for user icon
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default SOSCard;
