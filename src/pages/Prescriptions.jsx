import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Plus, Edit2, Trash2, X, Search, ClipboardList, Clock, User, Pill, Calendar } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

const ITEMS_PER_PAGE = 6;

const Prescriptions = () => {
    const {
        prescriptions,
        addPrescription,
        updatePrescription,
        deletePrescription,
        patients,
        medications,
        showToast,
        user
    } = useApp();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Helper for local date (YYYY-MM-DD)
    const getLocalToday = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getFutureDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        patientId: '',
        medicationId: '',
        frequency: '',
        startDate: getLocalToday(),
        endDate: getFutureDate(6),
        duration: '7',
        times: ['08:00'],
        doseAmount: '1'
    });

    // Filter Logic
    const filteredPrescriptions = prescriptions.filter(presc => {
        const patient = patients.find(p => p.id === presc.patientId);
        const medication = medications.find(m => m.id === presc.medicationId);
        const searchLower = searchTerm.toLowerCase();

        return (
            patient?.name.toLowerCase().includes(searchLower) ||
            medication?.name.toLowerCase().includes(searchLower) ||
            presc.frequency.toLowerCase().includes(searchLower)
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPrescriptions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleEdit = (prescription) => {
        // Calculate duration logic
        const start = new Date(prescription.startDate);
        const end = new Date(prescription.endDate || prescription.startDate); // Fallback
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        setFormData({
            ...prescription,
            startDate: prescription.startDate.split('T')[0],
            endDate: (prescription.endDate || prescription.startDate).split('T')[0],
            duration: diffDays.toString()
        });
        setEditingId(prescription.id);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deletePrescription(deleteId);
            setDeleteId(null);
            if (paginatedPrescriptions.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            patientId: '',
            medicationId: '',
            frequency: '',
            startDate: getLocalToday(),
            endDate: getFutureDate(6),
            duration: '7',
            times: ['08:00'],
            doseAmount: '1'
        });
    };

    const handleAddTime = () => {
        setFormData({
            ...formData,
            times: [...formData.times, '']
        });
    };

    const handleRemoveTime = (index) => {
        if (formData.times.length > 1) {
            setFormData({
                ...formData,
                times: formData.times.filter((_, i) => i !== index)
            });
        }
    };

    const handleTimeChange = (index, value) => {
        const newTimes = [...formData.times];
        newTimes[index] = value;
        setFormData({
            ...formData,
            times: newTimes
        });
    };

    // Duration/Date Logic
    const handleDurationChange = (e) => {
        const duration = parseInt(e.target.value) || 0;
        const start = new Date(formData.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + duration - 1);

        setFormData({
            ...formData,
            duration: e.target.value,
            endDate: end.toISOString().split('T')[0]
        });
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        const duration = parseInt(formData.duration) || 0;
        const start = new Date(newStartDate);
        const end = new Date(start);
        end.setDate(start.getDate() + duration - 1);

        setFormData({
            ...formData,
            startDate: newStartDate,
            endDate: end.toISOString().split('T')[0]
        });
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        const start = new Date(formData.startDate);
        const end = new Date(newEndDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        setFormData({
            ...formData,
            endDate: newEndDate,
            duration: diffDays.toString()
        });
    };


    const validateForm = () => {
        const errors = [];

        if (!formData.patientId) errors.push('Selecione um paciente');
        if (!formData.medicationId) errors.push('Selecione um medicamento');
        if (!formData.frequency.trim()) errors.push('Informe a frequência/posologia');
        if (formData.times.length === 0) errors.push('Adicione pelo menos um horário');
        if (formData.times.some(time => !time)) errors.push('Preencha todos os horários');

        // Validate Date Order
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            errors.push('A data final não pode ser anterior à data inicial');
        }

        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!user) {
            showToast('Você precisa fazer login primeiro!', 'error');
            return;
        }

        const errors = validateForm();
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        // Ordenar horários
        const sortedTimes = [...formData.times].sort();

        if (editingId) {
            updatePrescription(editingId, { ...formData, times: sortedTimes });
        } else {
            addPrescription({ ...formData, times: sortedTimes });
        }
        handleCancel();
    };

    const getPatientName = (patientId) => {
        return patients.find(p => p.id === patientId)?.name || 'Paciente não encontrado';
    };

    const getMedicationInfo = (medicationId) => {
        const med = medications.find(m => m.id === medicationId);
        return med ? `${med.name} ${med.dosage}` : 'Medicamento não encontrado';
    };

    return (
        <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Prescrições</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as receitas e horários dos medicamentos.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="shadow-xl shadow-primary/20">
                        <Plus size={20} className="mr-2" />
                        Nova Prescrição
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            {!showForm && prescriptions.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente, medicamento ou frequência..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-soft focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Form Section */}
            {showForm ? (
                <Card className="border-l-4 border-l-primary shadow-2xl ring-1 ring-black/5">
                    <CardHeader className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white">{editingId ? 'Editar Prescrição' : 'Nova Prescrição'}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados abaixo</p>
                        </div>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={24} />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Patient Select */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                                    <User size={16} />
                                    Paciente
                                </label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                    value={formData.patientId}
                                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um paciente</option>
                                    {patients.map(patient => (
                                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Medication Select */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                                    <Pill size={16} />
                                    Medicamento
                                </label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                    value={formData.medicationId}
                                    onChange={e => setFormData({ ...formData, medicationId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um medicamento</option>
                                    {medications.map(med => (
                                        <option key={med.id} value={med.id}>{med.name} {med.dosage}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Frequência/Posologia"
                                        placeholder="Ex: 12 em 12 horas, 3x ao dia"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Dose Por Horário (Qtd)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                                        placeholder="Ex: 1.0"
                                        value={formData.doseAmount}
                                        onChange={e => setFormData({ ...formData, doseAmount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date Section with Auto Calculation */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <Input
                                    label="Data de Início"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleStartDateChange}
                                    required
                                />
                                <Input
                                    label="Duração (dias)"
                                    type="number"
                                    placeholder="Ex: 7"
                                    value={formData.duration}
                                    onChange={handleDurationChange}
                                    required
                                />
                                <Input
                                    label="Data Final"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleEndDateChange}
                                    required
                                />
                            </div>

                            {/* Times Section */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                                        <Clock size={16} />
                                        Horários (escolha individualmente)
                                    </label>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleAddTime}>
                                        <Plus size={16} className="mr-1" />
                                        Adicionar Horário
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {formData.times.map((time, index) => (
                                        <div key={index} className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                            <input
                                                type="time"
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 shadow-sm"
                                                value={time}
                                                onChange={e => handleTimeChange(index, e.target.value)}
                                                required
                                            />
                                            {formData.times.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTime(index)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Remover horário"
                                                >
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-4 pt-6 border-t border-slate-50">
                                <Button type="button" variant="ghost" onClick={handleCancel} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {editingId ? 'Salvar Alterações' : 'Cadastrar Prescrição'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {paginatedPrescriptions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <ClipboardList size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhuma prescrição cadastrada</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 mb-6">Comece adicionando uma prescrição para gerenciar os horários dos medicamentos.</p>
                            <Button variant="outline" onClick={() => setShowForm(true)}>
                                Adicionar Primeira Prescrição
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paginatedPrescriptions.map(prescription => (
                                <Card key={prescription.id} className="group hover:border-primary/30">
                                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                        {/* Icon */}
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <ClipboardList size={32} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1">
                                                {getMedicationInfo(prescription.medicationId)}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                                                <span className="bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-600 flex items-center gap-1">
                                                    <User size={14} />
                                                    {getPatientName(prescription.patientId)}
                                                </span>
                                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                                <span className="font-medium text-primary">{prescription.frequency}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Clock size={16} className="shrink-0" />
                                                <span>Horários: {prescription.times.join(', ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <Calendar size={14} className="shrink-0" />
                                                <span>{formatDate(prescription.startDate)} até {formatDate(prescription.endDate)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 md:flex-none justify-start text-slate-600 hover:text-primary"
                                                onClick={() => handleEdit(prescription)}
                                            >
                                                <Edit2 size={18} className="mr-2" /> Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 md:flex-none justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                onClick={() => handleDeleteClick(prescription.id)}
                                            >
                                                <Trash2 size={18} className="mr-2" /> Excluir
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            {/* Delete Modal */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Excluir Prescrição"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmDelete}>Confirmar Exclusão</Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <p className="text-slate-600 text-lg">
                        Tem certeza que deseja excluir esta prescrição?
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Essa ação não pode ser desfeita.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default Prescriptions;
