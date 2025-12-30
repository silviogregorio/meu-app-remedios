import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Exclusão',
    description,
    confirmText = 'Excluir',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false
}) => {
    const getVariantConfig = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="text-red-600" size={24} />,
                    iconBg: 'bg-red-100',
                    confirmBtnClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                };
            case 'success':
                return {
                    icon: <CheckCircle className="text-emerald-600" size={24} />,
                    iconBg: 'bg-emerald-100',
                    confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                };
            case 'info':
                return {
                    icon: <Info className="text-blue-600" size={24} />,
                    iconBg: 'bg-blue-100',
                    confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                };
            default: // primary / default
                return {
                    icon: <HelpCircle className="text-primary" size={24} />,
                    iconBg: 'bg-primary/10',
                    confirmBtnClass: 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
                };
        }
    };

    const config = getVariantConfig();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex gap-3 justify-end w-full px-1 py-1">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none border-slate-300 text-slate-700"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 sm:flex-none font-bold ${config.confirmBtnClass}`}
                    >
                        {isLoading ? 'Processando...' : confirmText}
                    </Button>
                </div>
            }
        >
            <div className="flex items-start gap-4 py-4">
                <div className={`p-3 ${config.iconBg} rounded-2xl shrink-0`}>
                    {config.icon}
                </div>
                <div className="space-y-2 flex-1">
                    <div className="text-slate-600 leading-relaxed font-medium">
                        {description}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
