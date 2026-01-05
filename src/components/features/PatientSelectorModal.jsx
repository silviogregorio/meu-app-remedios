import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { User, Users, ChevronRight } from 'lucide-react';

const PatientSelectorModal = ({ isOpen, onClose, onSelect }) => {
    const { user, patients } = useApp();

    const allProfiles = useMemo(() => {
        const list = [];

        // Add Main User (Me) - REMOVED per user request
        // if (user) { ... }

        // Add Managed Patients
        if (patients && patients.length > 0) {
            patients.forEach(p => {
                list.push({
                    ...p,
                    type: 'patient',
                    isSelf: false
                });
            });
        }

        return list;
    }, [user, patients]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="De quem é o relatório?"
        >
            <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                    Selecione o paciente para gerar o histórico completo de saúde.
                </p>

                <div className="flex flex-col gap-2">
                    {allProfiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => onSelect(profile)}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.isSelf ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {profile.isSelf ? <User size={20} /> : <Users size={20} />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-semibold text-gray-800 group-hover:text-emerald-700">
                                        {profile.name}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {profile.isSelf ? 'Meu Perfil' : 'Dependente / Familiar'}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500" />
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default PatientSelectorModal;
