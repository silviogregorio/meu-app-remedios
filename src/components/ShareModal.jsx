import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { Users, Mail, Trash2, Eye, Edit2, Shield } from 'lucide-react';

/**
 * Modal for sharing patient access with other users
 */
const ShareModal = ({ isOpen, onClose, patient, onShare, onUnshare }) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleShare = async () => {
        if (!email.trim()) return;

        setIsSubmitting(true);
        try {
            await onShare(patient.id, email.trim(), permission);
            setEmail('');
            setPermission('view');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnshare = async (shareUserId) => {
        await onUnshare(patient.id, shareUserId);
    };

    const sharedUsers = patient?.sharedWith || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar Paciente">
            <div className="space-y-6">
                {/* Info Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Shield className="text-blue-600 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 text-sm">Como funciona?</h4>
                            <p className="text-blue-700 text-xs mt-1">
                                Compartilhe o acesso a este paciente com outros usuários.
                                Eles poderão visualizar ou editar conforme a permissão concedida.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add User Form */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Adicionar Acesso</h3>

                    <Input
                        label="Email do Usuário"
                        type="email"
                        placeholder="usuario@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={18} />}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">
                            Permissão
                        </label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                        >
                            <option value="view">Visualizar - Pode apenas ver os dados</option>
                            <option value="edit">Editar - Pode visualizar e modificar</option>
                        </select>
                    </div>

                    <Button
                        onClick={handleShare}
                        disabled={!email.trim() || isSubmitting}
                        className="w-full"
                    >
                        <Users size={18} className="mr-2" />
                        {isSubmitting ? 'Compartilhando...' : 'Compartilhar'}
                    </Button>
                </div>

                {/* Shared Users List */}
                {sharedUsers.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900">Usuários com Acesso</h3>
                        <div className="space-y-2">
                            {sharedUsers.map((share, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                            {share.email?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">
                                                {share.email}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {share.permission === 'edit' ? (
                                                    <>
                                                        <Edit2 size={14} className="text-green-600" />
                                                        <span className="text-xs text-green-600 font-medium">
                                                            Pode editar
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye size={14} className="text-blue-600" />
                                                        <span className="text-xs text-blue-600 font-medium">
                                                            Apenas visualizar
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnshare(share.userId)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Remover acesso"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {sharedUsers.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Nenhum usuário com acesso ainda</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ShareModal;
