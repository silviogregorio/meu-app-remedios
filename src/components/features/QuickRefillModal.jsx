import React, { useState } from 'react';
import { X, Plus, Minus, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { StockService } from '../../services/stockService';
import { useApp } from '../../context/AppContext';

/**
 * Quick Refill Modal - Fast stock replenishment in 2 clicks
 * Premium UX optimized for caregivers
 */
const QuickRefillModal = ({ medication, onClose, onSuccess }) => {
    const { user, showToast, refreshMedications } = useApp();
    const [quantity, setQuantity] = useState(30);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Quick presets for common quantities
    const presets = [10, 30, 60, 90];

    const handleSubmit = async () => {
        if (quantity <= 0) {
            showToast('Quantidade deve ser maior que zero', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await StockService.addRefill(
                medication.id,
                quantity,
                user.id,
                parseFloat(medication.quantity) || 0,
                notes
            );

            showToast(`✅ Estoque atualizado! Novo saldo: ${result.newBalance}`, 'success');

            // Refresh medications list
            if (refreshMedications) await refreshMedications();
            if (onSuccess) onSuccess(result);
            onClose();
        } catch (error) {
            console.error('Refill error:', error);
            showToast('Erro ao adicionar estoque. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = (amount) => {
        setQuantity(prev => Math.max(1, prev + amount));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Adicionar Estoque</h2>
                            <p className="text-green-100 font-medium">{medication.name}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Current Stock Info */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Package size={20} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">Estoque atual</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900">
                            {medication.quantity || 0}
                        </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                            Quantidade a adicionar
                        </label>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => incrementQuantity(-10)}
                                className="w-14 h-14 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors font-bold text-slate-600"
                            >
                                <Minus size={24} />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-24 h-16 text-center text-3xl font-black text-slate-900 border-2 border-slate-200 rounded-2xl focus:border-green-500 outline-none"
                                min="1"
                            />
                            <button
                                onClick={() => incrementQuantity(10)}
                                className="w-14 h-14 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded-2xl transition-colors font-bold text-green-600"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex gap-2 justify-center">
                        {presets.map(preset => (
                            <button
                                key={preset}
                                onClick={() => setQuantity(preset)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-bold transition-all
                                    ${quantity === preset
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }
                                `}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    {/* Notes (optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">
                            Observação (opcional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Compra na farmácia X"
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-green-500 outline-none"
                        />
                    </div>

                    {/* New Balance Preview */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center gap-3">
                            <Sparkles size={20} className="text-green-600" />
                            <span className="text-sm font-bold text-green-700">Novo saldo</span>
                        </div>
                        <span className="text-2xl font-black text-green-700">
                            {(parseFloat(medication.quantity) || 0) + quantity}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || quantity <= 0}
                        className="flex-1 py-3 px-4 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus size={20} />
                                Adicionar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickRefillModal;
