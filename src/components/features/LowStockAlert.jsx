import React, { useState, useMemo } from 'react';
import { AlertTriangle, ShoppingCart, ChevronRight, Package, Clock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockService } from '../../services/stockService';
import QuickRefillModal from './QuickRefillModal';

/**
 * LowStockAlert - Card displayed on Home when medications are running low
 */
const LowStockAlert = () => {
    const { medications, prescriptions } = useApp();
    const [refillMed, setRefillMed] = useState(null);
    const [dismissed, setDismissed] = useState([]);

    // Calculate low stock medications
    const lowStockMeds = useMemo(() => {
        return StockService.getLowStockMedications(medications, prescriptions, 7)
            .filter(med => !dismissed.includes(med.id));
    }, [medications, prescriptions, dismissed]);

    if (lowStockMeds.length === 0) return null;

    const handleDismiss = (medId) => {
        setDismissed(prev => [...prev, medId]);
    };

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-4 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-900">Estoque Baixo</h3>
                        <p className="text-xs text-amber-700">
                            {lowStockMeds.length} {lowStockMeds.length === 1 ? 'medicamento precisa' : 'medicamentos precisam'} de reposição
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {lowStockMeds.slice(0, 3).map(med => (
                        <div
                            key={med.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-100 relative group"
                        >
                            {/* Dismiss button */}
                            <button
                                onClick={() => handleDismiss(med.id)}
                                className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-100 transition-all"
                                title="Dispensar"
                            >
                                <X size={14} className="text-amber-400" />
                            </button>

                            <div className={`p-2 rounded-xl ${med.level === 'critical' ? 'bg-rose-100' : 'bg-amber-100'
                                }`}>
                                <Package size={18} className={
                                    med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                } />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{med.name}</p>
                                <p className="text-xs text-slate-500">
                                    {med.quantity || 0} restantes
                                    {med.daysRemaining !== null && (
                                        <span className={`ml-2 font-bold ${med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                            }`}>
                                            <Clock size={10} className="inline mr-0.5" />
                                            {med.daysRemaining}d
                                        </span>
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={() => setRefillMed(med)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${med.level === 'critical'
                                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    }`}
                            >
                                <ShoppingCart size={14} />
                                Repor
                            </button>
                        </div>
                    ))}

                    {lowStockMeds.length > 3 && (
                        <p className="text-xs text-amber-600 text-center font-medium pt-1">
                            + {lowStockMeds.length - 3} outros medicamentos
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
