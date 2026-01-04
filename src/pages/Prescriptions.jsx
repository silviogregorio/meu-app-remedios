import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateCalendarUrlsForPrescription, downloadICalFile } from '../utils/calendarUtils';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import { Plus, Edit2, Trash2, X, Search, ClipboardList, Clock, User, Pill, Calendar, Camera, AlertTriangle, Info, RotateCw } from 'lucide-react';
import { formatDate, getISODate } from '../utils/dateFormatter';
import { checkInteractions } from '../data/drugInteractions';

const ITEMS_PER_PAGE = 5;

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
    const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPageLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Helper for local date (YYYY-MM-DD)
    const getLocalToday = () => getISODate();

    const getFutureDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return getISODate(date);
    };

    const [formData, setFormData] = useState({
        patientId: '',
        medicationId: '',
        frequency: '',
        startDate: getLocalToday(),
        endDate: getFutureDate(6),
        continuousUse: false,
        duration: '7',
        times: ['08:00'],
        doseAmount: '1'
    });

    const [interactions, setInteractions] = useState(null);

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

    // Drug Interaction Check
    useEffect(() => {
        if (formData.medicationId && formData.patientId) {
            const today = getISODate();
            const selectedMed = medications.find(m => m.id === formData.medicationId);

            // Filter only ACTIVE prescriptions (Continuous or EndDate >= Today)
            const patientPrescriptions = prescriptions.filter(p =>
                p.patientId === formData.patientId &&
                p.id !== editingId &&
                (p.continuousUse || (p.endDate && p.endDate >= today))
            );

            const currentMeds = patientPrescriptions.map(p => {
                const med = medications.find(m => m.id === p.medicationId);
                return med ? { name: med.name, id: med.id } : null;
            }).filter(Boolean);

            if (selectedMed) {
                const found = checkInteractions(selectedMed.name, currentMeds);
                setInteractions(found);
            }
        } else {
            setInteractions(null);
        }
    }, [formData.medicationId, formData.patientId, prescriptions, medications, editingId]);

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

    const handleDeleteClick = (prescription) => {
        setPrescriptionToDelete(prescription);
    };

    const confirmDelete = () => {
        if (prescriptionToDelete) {
            deletePrescription(prescriptionToDelete.id);
            setPrescriptionToDelete(null);
            if (paginatedPrescriptions.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setInteractions(null); // Clear interactions when canceling
        setFormData({
            patientId: '',
            medicationId: '',
            frequency: '',
            startDate: getLocalToday(),
            endDate: getFutureDate(6),
            continuousUse: false,
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

        if (isNaN(start.getTime())) return; // Guard against invalid start date

        const end = new Date(start);
        end.setDate(start.getDate() + duration - 1);

        if (isNaN(end.getTime())) return; // Guard against invalid end date calculation

        setFormData({
            ...formData,
            duration: e.target.value,
            endDate: getISODate(end)
        });
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        const duration = parseInt(formData.duration) || 0;
        const start = new Date(newStartDate);

        // Allow user to type incomplete date without crashing
        if (isNaN(start.getTime())) {
            setFormData({
                ...formData,
                startDate: newStartDate
            });
            return;
        }

        const end = new Date(start);
        end.setDate(start.getDate() + duration - 1);

        if (isNaN(end.getTime())) return;

        setFormData({
            ...formData,
            startDate: newStartDate,
            endDate: getISODate(end)
        });
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        const start = new Date(formData.startDate);
        const end = new Date(newEndDate);

        // Allow incomplete date typing logic
        if (isNaN(end.getTime())) {
            setFormData({
                ...formData,
                endDate: newEndDate
            });
            return;
        }

        if (isNaN(start.getTime())) return;

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
        if (!formData.continuousUse && new Date(formData.endDate) < new Date(formData.startDate)) {
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
            {isPageLoading ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                        <div className="h-4 w-64 bg-slate-200 rounded-lg" />
                    </div>
                    <div className="h-12 w-40 bg-slate-200 rounded-xl shadow-sm" />
                </div>
            ) : (
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
            )}

            {/* Form Section */}
            {showForm ? (
                <Card className="border-l-4 border-l-primary shadow-2xl ring-1 ring-black/5">
                    <CardHeader className="flex flex-col gap-5 border-b border-slate-50 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <button
                                onClick={handleCancel}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm shrink-0 flex items-center justify-center mr-2"
                                title="Fechar"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
                                <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                                    <ClipboardList className="text-primary" size={24} />
                                </div>
                                <span className="truncate">{editingId ? 'Editar Prescrição' : 'Nova Prescrição'}</span>
                            </h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="w-full h-px bg-slate-100" />
                            <p className="text-slate-500 font-medium text-sm italic border-l-4 border-primary/20 pl-3 py-1">
                                Preencha os dados abaixo para organizar os horários de medicação.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
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
                                    {patients.filter(p => p.userId === user?.id).map(patient => (
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

                            {/* Interaction Alerts */}
                            {interactions && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {interactions.map((interaction, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-xl border-2 flex flex-col gap-3 shadow-md
                                                ${interaction.severity === 'high'
                                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                                    : interaction.severity === 'medium'
                                                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                                                        : 'bg-blue-50 border-blue-200 text-blue-900'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full shrink-0 
                                                    ${interaction.severity === 'high' ? 'bg-rose-100' : interaction.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                                    <AlertTriangle size={20} className={interaction.severity === 'high' ? 'text-rose-600' : interaction.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm leading-tight mb-1">
                                                        ⚠️ Possível Interação: {medications.find(m => m.id === formData.medicationId)?.name} + {interaction.offendingMed}
                                                    </p>
                                                    <p className="text-sm opacity-90 leading-relaxed font-medium">
                                                        {interaction.message}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-current/10">
                                                <Info size={14} className="shrink-0" />
                                                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                                                    Importante: A palavra final é sempre do seu médico.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <div className="flex flex-col gap-1">
                                        <Input
                                            label="Frequência/Posologia"
                                            placeholder="Ex: 12 em 12 horas, 3x ao dia"
                                            value={formData.frequency}
                                            onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                            required
                                        />
                                    </div>
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
                                <div className="md:col-span-3 pb-2 border-b border-slate-200 mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Período do Tratamento
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="continuousUse"
                                            checked={formData.continuousUse}
                                            onChange={e => setFormData({ ...formData, continuousUse: e.target.checked, endDate: e.target.checked ? null : getFutureDate(6), duration: e.target.checked ? '' : '7' })}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="continuousUse" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
                                            Uso Contínuo (Sem data final)
                                        </label>
                                    </div>
                                </div>

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
                                    placeholder={formData.continuousUse ? "Indeterminado" : "Ex: 7"}
                                    value={formData.duration}
                                    onChange={handleDurationChange}
                                    disabled={formData.continuousUse}
                                    required={!formData.continuousUse}
                                    className={formData.continuousUse ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}
                                />
                                <Input
                                    label="Data Final"
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={handleEndDateChange}
                                    disabled={formData.continuousUse}
                                    required={!formData.continuousUse}
                                    className={formData.continuousUse ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}
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
                <div className="flex flex-col gap-8">
                    {/* Search Bar */}
                    {isPageLoading ? (
                        <div className="h-12 w-full bg-slate-200 rounded-2xl animate-pulse" />
                    ) : (
                        prescriptions.length > 0 && (
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
                        )
                    )}

                    {isPageLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0 mt-1" />
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="h-3 w-20 bg-slate-200 rounded" />
                                                <div className="h-6 w-48 bg-slate-200 rounded" />
                                                <div className="h-3 w-32 bg-slate-200 rounded mt-1" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4 p-4 pl-0">
                                            {/* Top Section */}
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                                                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                                                </div>
                                            </div>
                                            {/* Stats Strip */}
                                            <div className="flex gap-4 pt-2">
                                                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                                                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                                                <div className="h-8 w-full bg-slate-200 rounded-lg" />
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="bg-slate-50/50 p-3 flex justify-end gap-2 mt-auto border-t border-slate-100/50">
                                            <div className="w-24 h-9 bg-slate-200/50 rounded-lg" />
                                            <div className="w-20 h-9 bg-slate-200/50 rounded-lg" />
                                            <div className="w-20 h-9 bg-slate-200/50 rounded-lg" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : paginatedPrescriptions.length === 0 ? (
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
                        <div className="grid gap-3">
                            {paginatedPrescriptions.map(prescription => (
                                <Card key={prescription.id} className="group hover:border-primary/30 transition-all duration-300">
                                    {/* Main Content */}
                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                                                <Pill size={24} />
                                            </div>

                                            {/* Header Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-xl text-slate-800 dark:text-white leading-tight mb-1">
                                                    {getMedicationInfo(prescription.medicationId)}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="truncate">{getPatientName(prescription.patientId)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Badge Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {/* Freq */}
                                            <div className="col-span-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Frequência</span>
                                                <div className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                                                    <RotateCw size={14} className="text-blue-500" />
                                                    {prescription.frequency}
                                                </div>
                                            </div>

                                            {/* Times */}
                                            <div className="col-span-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Horários</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {prescription.times.map(t => (
                                                        <span key={t} className="bg-white px-1.5 py-0.5 rounded text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Duração</span>
                                                <div className="font-bold text-slate-700 text-sm flex items-center gap-1.5 whitespace-nowrap">
                                                    <Calendar size={14} className="text-emerald-500" />
                                                    {formatDate(prescription.startDate)} {prescription.continuousUse ? '(Uso Contínuo)' : `até ${formatDate(prescription.endDate)}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="bg-slate-50/50 p-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 rounded-b-2xl">
                                        {patients.find(p => p.id === prescription.patientId)?.userId === user?.id ? (
                                            <>
                                                <button
                                                    className="h-9 px-4 flex items-center justify-center rounded-lg bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 shadow-sm text-xs font-bold tracking-wide transition-all gap-2"
                                                    onClick={() => {
                                                        const med = medications.find(m => m.id === prescription.medicationId);
                                                        const pat = patients.find(p => p.id === prescription.patientId);
                                                        const urls = generateCalendarUrlsForPrescription(prescription, med, pat);

                                                        if (urls.length === 1) {
                                                            window.open(urls[0].url, '_blank');
                                                        } else {
                                                            const choice = confirm(
                                                                `Este medicamento tem ${urls.length} horários.\n\n` +
                                                                `Clique OK para abrir os links do Google Calendar\n` +
                                                                `ou Cancelar para baixar os arquivos .ics`
                                                            );
                                                            if (choice) {
                                                                urls.forEach(({ url }) => window.open(url, '_blank'));
                                                            } else {
                                                                urls.forEach(({ time }) => {
                                                                    downloadICalFile(prescription, med, pat, time);
                                                                });
                                                            }
                                                        }
                                                        showToast('Processando calendário...', 'success');
                                                    }}
                                                >
                                                    <Calendar size={15} className="text-emerald-600" />
                                                    Agendar
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(prescription)}
                                                    className="h-9 px-3 flex items-center justify-center rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm text-xs font-bold gap-2"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={15} />
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(prescription)}
                                                    className="h-9 px-3 flex items-center justify-center rounded-lg bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm text-xs font-bold gap-2"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={15} />
                                                    Excluir
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full py-2 bg-slate-50 rounded-xl text-center text-slate-400 text-sm font-medium border border-slate-100">
                                                Modo Leitura (Compartilhado)
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {!showForm && !isPageLoading && paginatedPrescriptions.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={!!prescriptionToDelete}
                onClose={() => setPrescriptionToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Prescrição"
                description={
                    prescriptionToDelete ? (
                        <span>
                            Tem certeza que deseja excluir a prescrição de:
                            <br /><br />
                            <strong className="text-slate-900 block font-bold text-lg leading-tight">
                                {getMedicationInfo(prescriptionToDelete.medicationId)}
                            </strong>
                            <span className="text-slate-500 text-sm block mt-1">
                                para {getPatientName(prescriptionToDelete.patientId)}
                            </span>
                            <br />
                            <span className="block text-red-600 font-medium">
                                Essa ação não pode ser desfeita.
                            </span>
                        </span>
                    ) : "Tem certeza que deseja excluir esta prescrição?"
                }
            />
        </div>
    );
};

export default Prescriptions;
