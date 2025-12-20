import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation dialog component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm handler
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {string} props.variant - Variant: 'danger' | 'warning' | 'info'
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar ação',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const variantColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700'
    };

    const iconColors = {
        danger: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-${variant === 'danger' ? 'red' : variant === 'warning' ? 'yellow' : 'blue'}-100 flex items-center justify-center`}>
                        <AlertTriangle className={iconColors[variant]} size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="text-slate-700 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className={`flex-1 ${variantColors[variant]}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
