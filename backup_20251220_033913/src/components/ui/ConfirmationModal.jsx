import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Exclusão',
    description = 'Tem certeza que deseja realizar esta ação? Esta ação não pode ser desfeita.',
    confirmText = 'Excluir',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                        {isLoading ? 'Processando...' : confirmText}
                    </Button>
                </div>
            }
        >
            <div className="flex items-start gap-4 py-2">
                <div className="p-3 bg-red-100 rounded-full shrink-0">
                    <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div className="space-y-2">
                    <p className="text-slate-600 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
