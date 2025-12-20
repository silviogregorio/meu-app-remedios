import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={clsx(
            "fixed top-4 right-4 z-[10000] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300",
            type === 'success' ? "bg-white border-l-4 border-[#10b981]" : "bg-white border-l-4 border-red-500"
        )}>
            {type === 'success' ? (
                <CheckCircle size={20} className="text-[#10b981]" />
            ) : (
                <AlertCircle size={20} className="text-red-500" />
            )}
            <p className="text-sm font-medium text-gray-800">{message}</p>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
