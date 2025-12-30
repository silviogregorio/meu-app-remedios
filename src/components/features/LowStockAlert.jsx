import React, { useState, useMemo } from 'react';
import { AlertTriangle, ShoppingCart, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockService } from '../../services/stockService';
import QuickRefillModal from './QuickRefillModal';

/**
 * LowStockAlert - Card displayed on Home when medications are running low
 * Designed for elderly users with large, clear buttons
 */
const LowStockAlert = () => {
    const { medications, prescriptions } = useApp();
    const [refillMed, setRefillMed] = useState(null);

    // Calculate low stock medications
    const lowStockMeds = useMemo(() => {
        return StockService.getLowStockMedications(medications, prescriptions, 7);
    }, [medications, prescriptions]);

    if (lowStockMeds.length === 0) return null;

    // Helper to format days remaining in clear text
    const formatDaysRemaining = (days) => {
        if (days === 0) return '⚠️ Acaba hoje!';
        if (days === 1) return '⚠️ Acaba amanhã!';
        return `${days} dias restantes`;
    };

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-4 md:p-5 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-100 rounded-2xl">
                        <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-amber-900">Estoque Baixo</h3>
                        <p className="text-sm text-amber-700">
                            {lowStockMeds.length} {lowStockMeds.length === 1 ? 'medicamento precisa' : 'medicamentos precisam'} de reposição
                        </p>
                    </div>
                </div>

                {/* Medication List */}
                <div className="space-y-3">
                    {lowStockMeds.slice(0, 3).map(med => (
                        <div
                            key={med.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white rounded-2xl border border-amber-100 shadow-sm"
                        >
                            {/* Left: Icon + Info */}
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`p-3 rounded-xl shrink-0 ${med.level === 'critical' ? 'bg-rose-100' : 'bg-amber-100'
                                    }`}>
                                    <Package size={22} className={
                                        med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                    } />
                                </div>

                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-base">{med.name}</p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">{med.quantity || 0}</span> unidades restantes
                                    </p>
                                    {/* Clear duration text */}
                                    {med.daysRemaining !== null && (
                                        <p className={`text-sm font-bold mt-1 ${med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                            }`}>
                                            {formatDaysRemaining(med.daysRemaining)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Big Refill Button */}
                            <button
                                onClick={() => setRefillMed(med)}
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${med.level === 'critical'
                                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                                    }`}
                            >
                                <ShoppingCart size={18} />
                                Repor Estoque
                            </button>
                        </div>
                    ))}

                    {/* More medications indicator */}
                    {lowStockMeds.length > 3 && (
                        <p className="text-sm text-amber-700 text-center font-medium pt-2 bg-amber-100/50 rounded-xl py-2">
                            + {lowStockMeds.length - 3} outros medicamentos com estoque baixo
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Refill Modal */}
            {refillMed && (
                <QuickRefillModal
                    medication={refillMed}
                    onClose={() => setRefillMed(null)}
                    onSuccess={() => setRefillMed(null)}
                />
            )}
        </>
    );
};

export default LowStockAlert;
