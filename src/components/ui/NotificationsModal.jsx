import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Check, X, UserPlus, Bell, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockService } from '../../services/stockService';
import QuickRefillModal from '../features/QuickRefillModal';

const NotificationsModal = ({ isOpen, onClose }) => {
    const {
        pendingShares, acceptShare, rejectShare,
        pendingAccountShares, acceptAccountShare, rejectAccountShare,
        medications, prescriptions
    } = useApp();
    const [refillMed, setRefillMed] = useState(null);

    // Calculate low stock medications
    const lowStockMeds = useMemo(() => {
        return StockService.getLowStockMedications(medications, prescriptions, 7);
    }, [medications, prescriptions]);

    const totalNotifications = pendingShares.length + pendingAccountShares.length + lowStockMeds.length;

    // Helper to format days remaining in clear text
    const formatDaysRemaining = (days) => {
        if (days === 0) return '⚠️ Acaba hoje!';
        if (days === 1) return '⚠️ Acaba amanhã!';
        return `${days} dias restantes`;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Notificações ${totalNotifications > 0 ? `(${totalNotifications})` : ''}`}
            >
                <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                    {/* Stock Alerts Section */}
                    {lowStockMeds.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold">Medicamentos com Estoque Baixo</span>
                            </div>
                            {lowStockMeds.map(med => (
                                <div key={med.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${med.level === 'critical' ? 'bg-rose-100' : 'bg-amber-100'}`}>
                                            <Package size={20} className={med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900">{med.name}</p>
                                            <p className="text-sm text-slate-600">
                                                <span className="font-semibold">{med.quantity || 0}</span> unidades restantes
                                            </p>
                                            {med.daysRemaining !== null && (
                                                <p className={`text-sm font-bold ${med.level === 'critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {formatDaysRemaining(med.daysRemaining)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setRefillMed(med)}
                                        className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${med.level === 'critical'
                                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                                            : 'bg-amber-500 text-white hover:bg-amber-600'
                                            }`}
                                    >
                                        <ShoppingCart size={16} />
                                        Repor Estoque
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pending Shares Section */}
                    {pendingShares.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <UserPlus size={16} />
                                <span className="text-sm font-bold">Convites Pendentes</span>
                            </div>
                            {pendingShares.map(share => (
                                <div key={share.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                            <UserPlus size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{share.owner?.full_name || share.owner?.email || 'Usuário'}</span> quer compartilhar o acesso ao paciente <span className="font-semibold">{share.patient?.name || 'Paciente'}</span> com você.
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

                    {/* Pending Account Shares Section */}
                    {pendingAccountShares.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                <UserPlus size={16} />
                                <span className="text-sm font-bold">Convites de Conta SiG</span>
                            </div>
                            {pendingAccountShares.map(share => (
                                <div key={share.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                            <UserPlus size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-900">
                                                <span className="font-semibold">{share.owner?.full_name || share.owner?.email || 'Usuário'}</span> quer compartilhar o acesso <span className="font-bold underline">TOTAL</span> à conta SiG Remédios com você.
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    onClick={() => acceptAccountShare(share.id)}
                                                >
                                                    <Check size={16} className="mr-1" /> Aceitar Conta
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => rejectAccountShare(share.id)}
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

                    {/* Empty State */}
                    {totalNotifications === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Bell size={48} className="mx-auto mb-4 text-slate-200" />
                            <p>Nenhuma notificação nova.</p>
                        </div>
                    )}
                </div>
            </Modal>

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

export default NotificationsModal;
