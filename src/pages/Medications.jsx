import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Plus, Pill, Trash2, Edit2, X, AlertTriangle, Search, User, Camera, Box } from 'lucide-react';
import PillIcon from '../components/ui/PillIcon'; // Import PillIcon
import { MedicationCardShimmer } from '../components/ui/Shimmer';

const ITEMS_PER_PAGE = 6;

const COLORS = [
    { id: 'white', label: 'Branco', hex: 'bg-slate-100' },
    { id: 'yellow', label: 'Amarelo', hex: 'bg-yellow-400' },
    { id: 'blue', label: 'Azul', hex: 'bg-blue-400' },
    { id: 'red', label: 'Vermelho', hex: 'bg-red-400' },
    { id: 'green', label: 'Verde', hex: 'bg-green-400' },
    { id: 'orange', label: 'Laranja', hex: 'bg-orange-400' },
    { id: 'pink', label: 'Rosa', hex: 'bg-pink-400' },
    { id: 'purple', label: 'Roxo', hex: 'bg-purple-400' },
    { id: 'black', label: 'Escuro', hex: 'bg-slate-800' },
];

const SHAPES = [
    { id: 'round', label: 'Redondo' },
    { id: 'capsule', label: 'Cápsula' },
    { id: 'oval', label: 'Oval' },
    { id: 'square', label: 'Quadrado' },
    { id: 'liquid', label: 'Líquido' },
];

const Medications = () => {
    const { medications, addMedication, updateMedication, deleteMedication, user, showToast } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingMedId, setEditingMedId] = useState(null);
    const [deleteMedId, setDeleteMedId] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Simulate loading to match Home page shimmer effect
    useEffect(() => {
        if (medications.length >= 0) {
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [medications]);

    const [medForm, setMedForm] = useState({
        name: '',
        dosage: '',
        type: '',
        quantity: '',
        unitQuantity: '',
        observations: '',
        color: 'white', // Default
        shape: 'round'  // Default
    });

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredMedications = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMedications.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredMedications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleMedEdit = (med) => {
        setMedForm({
            ...med,
            unitQuantity: med.unit_quantity || '',
            color: med.color || 'white',
            shape: med.shape || 'round'
        });
        setEditingMedId(med.id);
        setShowForm(true);
    };

    const confirmDeleteMed = async () => {
        if (deleteMedId) {
            await deleteMedication(deleteMedId);
            setDeleteMedId(null);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingMedId(null);
        setMedForm({ name: '', dosage: '', type: '', quantity: '', unitQuantity: '', observations: '', color: 'white', shape: 'round' });
    };

    const [submitting, setSubmitting] = useState(false);

    const handleMedSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingMedId) {
                await updateMedication(editingMedId, medForm);
            } else {
                await addMedication(medForm);
            }
            handleCancel();
        } catch (error) {
            console.error('Erro ao salvar medicamento:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Medicamentos</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seu estoque e a aparência dos remédios.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="shadow-xl shadow-primary/20">
                        <Plus size={20} className="mr-2" />
                        Novo Medicamento
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            {!showForm && medications.length > 0 && (
                <div className="relative">
                    <label htmlFor="med-search" className="sr-only">Buscar medicamento</label>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        id="med-search"
                        name="search"
                        type="text"
                        placeholder="Buscar medicamento..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-soft focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Form Section */}
            {showForm && (
                <Card className="border-l-4 border-l-primary shadow-2xl ring-1 ring-black/5">
                    <CardHeader className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                                {editingMedId ? 'Editar Medicamento' : 'Novo Medicamento'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados e escolha a aparência</p>
                        </div>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={24} />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleMedSubmit} className="flex flex-col gap-6">

                            {/* Visual Preview */}
                            <div className="flex justify-center mb-4">
                                <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aparência</span>
                                    <PillIcon shape={medForm.shape} color={medForm.color} size={64} className="drop-shadow-sm" />
                                    <p className="text-xs text-slate-500 mt-1">Como vai aparecer no app</p>
                                </div>
                            </div>

                            {/* Shape & Color Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-3 block">Formato</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SHAPES.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setMedForm({ ...medForm, shape: s.id })}
                                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${medForm.shape === s.id
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-3 block">Cor</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setMedForm({ ...medForm, color: c.id })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${medForm.color === c.id
                                                    ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 border-transparent'
                                                    : 'border-slate-200 hover:scale-105'}`}
                                                style={{ backgroundColor: c.id === 'white' ? '#f8fafc' : undefined }} // Little tweak for white
                                                title={c.label}
                                            >
                                                <div className={`w-full h-full rounded-full ${c.id === 'white' ? 'bg-slate-100' : c.hex} opacity-90`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Input
                                    label="Nome do Medicamento"
                                    id="medName"
                                    name="name"
                                    placeholder="Ex: Dipirona"
                                    value={medForm.name}
                                    onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Dosagem"
                                    id="medDosage"
                                    name="dosage"
                                    placeholder="Ex: 500mg"
                                    value={medForm.dosage}
                                    onChange={e => setMedForm({ ...medForm, dosage: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Tipo"
                                    id="medType"
                                    name="type"
                                    placeholder="Ex: Comprimido"
                                    value={medForm.type}
                                    onChange={e => setMedForm({ ...medForm, type: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Quantidade Total na Caixa"
                                    type="number"
                                    id="medUnitQty"
                                    name="unitQty"
                                    placeholder="Ex: 20"
                                    value={medForm.unitQuantity}
                                    onChange={e => setMedForm({ ...medForm, unitQuantity: e.target.value })}
                                />
                                <Input
                                    label="Quantidade Atual em Estoque"
                                    type="number"
                                    id="medStock"
                                    name="stock"
                                    placeholder="Ex: 15"
                                    value={medForm.quantity}
                                    onChange={e => setMedForm({ ...medForm, quantity: e.target.value })}
                                    step="0.1"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="medObs" className="text-sm font-semibold text-slate-700">Observações</label>
                                <textarea
                                    id="medObs"
                                    name="obs"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none min-h-[100px]"
                                    placeholder="Ex: Tomar com água, uso sublingual, etc."
                                    value={medForm.observations || ''}
                                    onChange={e => setMedForm({ ...medForm, observations: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded-lg -mt-4 border border-blue-100">
                                <span className="font-bold">Dica:</span> Para líquidos (xaropes, gotas), cadastre o volume total.
                            </p>
                            <div className="flex gap-4 mt-4 pt-6 border-t border-slate-50">
                                <Button type="button" variant="ghost" onClick={handleCancel} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={submitting}>
                                    {submitting ? 'Salvando...' : (editingMedId ? 'Salvar Alterações' : 'Cadastrar Medicamento')}
                                </Button>
                            </div>
                        </form>
                    </CardContent >
                </Card >
            )
            }

            {/* List Section */}
            {
                !showForm && (
                    <>
                        {isInitialLoading ? (
                            <div className="grid gap-4">
                                {[1, 2, 3, 4].map(n => (
                                    <MedicationCardShimmer key={n} />
                                ))}
                            </div>
                        ) : filteredMedications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                    <Pill size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhum medicamento encontrado</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 mb-6">Adicione medicamentos para controlar seu estoque.</p>
                                <Button variant="outline" onClick={() => setShowForm(true)}>
                                    Adicionar Medicamento
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {paginatedItems.map(item => (
                                    <Card key={item.id} className="group hover:border-primary/30 transition-all duration-300">
                                        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                                            {/* Left Section: Icon + Name */}
                                            <div className="flex items-start md:items-center gap-3 md:gap-4 md:w-1/3">
                                                {/* Icon Box */}
                                                <div className="w-10 h-10 md:w-10 md:h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                                    <PillIcon shape={item.shape} color={item.color} size={20} />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col gap-0.5 md:gap-1">
                                                    <h3 className="font-black text-xl md:text-xl text-slate-900 dark:text-white leading-tight break-words">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-base md:text-base font-bold text-slate-500 dark:text-slate-400">
                                                        {item.dosage}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Middle Section: Specs Grid -- Compact on mobile */}
                                            <div className="flex-1 grid grid-cols-[1.3fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-3 md:gap-4 bg-slate-50/50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border md:border-none border-slate-100/50">
                                                <div className="md:border-l md:border-slate-100 md:pl-6">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tipo</p>
                                                    <p className="font-bold text-slate-700 text-sm">{item.type || 'N/A'}</p>
                                                </div>

                                                <div className="md:border-l md:border-slate-100 md:pl-6">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Estoque</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black text-base md:text-base ${!item.quantity ? 'text-slate-400' :
                                                            Number(item.quantity) < 5 ? 'text-rose-500' : 'text-emerald-600'
                                                            }`}>
                                                            {item.quantity || '0'}
                                                        </span>
                                                        {Number(item.quantity) < 5 && (
                                                            <div className="bg-rose-100 text-rose-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                                Baixo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Observations */}
                                                <div className="col-span-2 md:col-span-1 md:border-l md:border-slate-100 md:pl-6">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Na Caixa</p>
                                                    <p className="font-black text-slate-900 text-sm">
                                                        {item.unit_quantity || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Section: Actions */}
                                            <div className="flex items-center gap-2 md:w-auto justify-end">
                                                {item.user_id === user?.id ? (
                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {/* Mobile: Full Buttons */}
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 md:hidden bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 h-10 shadow-sm"
                                                            onClick={() => handleMedEdit(item)}
                                                        >
                                                            <Edit2 size={18} className="mr-2" />
                                                            <span className="font-bold text-sm">Editar</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 md:hidden bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 h-10 shadow-sm"
                                                            onClick={() => setDeleteMedId(item.id)}
                                                        >
                                                            <Trash2 size={18} className="mr-2" />
                                                            <span className="font-bold text-sm">Excluir</span>
                                                        </Button>

                                                        {/* Desktop: Text Buttons (Better than just icons) */}
                                                        <div className="hidden md:flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                className="px-3 h-10 rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                                                                onClick={() => handleMedEdit(item)}
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={18} className="mr-2" />
                                                                <span className="font-semibold text-sm">Editar</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                className="px-3 h-10 rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                                                onClick={() => setDeleteMedId(item.id)}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={18} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full md:w-auto py-2 px-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs font-medium border border-slate-100 whitespace-nowrap">
                                                        Leitura
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )
            }

            <Modal
                isOpen={!!deleteMedId}
                onClose={() => setDeleteMedId(null)}
                title="Excluir Medicamento"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteMedId(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmDeleteMed}>Confirmar Exclusão</Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <p className="text-slate-600 text-lg">
                        Tem certeza que deseja excluir este medicamento?
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Isso removerá também todas as receitas associadas a ele.
                    </p>
                </div>
            </Modal>
        </div >
    );
};

export default Medications;
