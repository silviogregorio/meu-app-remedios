import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { Check, X, UserPlus, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NotificationsModal = ({ isOpen, onClose }) => {
    const { pendingShares, acceptShare, rejectShare } = useApp();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Notificações"
        >
            <div className="flex flex-col gap-4">
                {pendingShares.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Bell size={48} className="mx-auto mb-4 text-slate-200" />
                        <p>Nenhuma notificação nova.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {pendingShares.map(share => (
                            <div key={share.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                        <UserPlus size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-900">
                                            <span className="font-semibold">{share.owner.full_name || share.owner.email}</span> quer compartilhar o acesso ao paciente <span className="font-semibold">{share.patient.name}</span> com você.
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Permissão: {share.permission === 'edit' ? 'Editar' : 'Visualizar'}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => acceptShare(share.id)}
                                            >
                                                <Check size={16} className="mr-1" /> Aceitar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => rejectShare(share.id)}
                                            >
                                                <X size={16} className="mr-1" /> Recusar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default NotificationsModal;
