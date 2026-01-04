import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import { Plus, User, Edit2, Trash2, X, Search, ChevronRight, Calendar, Phone, Mail, Share2, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShareModal from '../components/ShareModal';
import { api } from '../services/api';

const ITEMS_PER_PAGE = 6;

// Helper to format CEP
const formatCep = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
};

// Helper to format Phone
const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

// Helper to calculate and format age
const formatAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null; // Guard against invalid dates
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years > 0) return `${years} anos`;
    if (months > 0) return `${months} meses`;
    return `${days} dias`;
};

const Patients = () => {
    const navigate = useNavigate();
    const { patients, addPatient, updatePatient, deletePatient, sharePatient, unsharePatient, showToast, user } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [patientToDelete, setPatientToDelete] = useState(null);
    const [sharingPatientId, setSharingPatientId] = useState(null); // ID of patient being shared
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        birthDate: '',
        phone: '',
        bloodType: '',
        allergies: '',
        condition: '', // Do not remove existing fields
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        observations: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_email: ''
    });
    const [loadingCep, setLoadingCep] = useState(false);

    // Shimmer Loading Simulation
    const [isPageLoading, setIsPageLoading] = useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Filter Logic
    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset page on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleEdit = (patient) => {
        setFormData(patient);
        setEditingId(patient.id);
        setShowForm(true);
    };

    const handleDeleteClick = (patient) => {
        setPatientToDelete(patient);
    };

    const confirmDelete = () => {
        if (patientToDelete) {
            deletePatient(patientToDelete.id);
            setPatientToDelete(null);
            if (paginatedPatients.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        }
    };

    const handleShareClick = (patient) => {
        setSharingPatientId(patient.id);
    };

    const handleShareSubmit = async (patientId, email, permission) => {
        await sharePatient(patientId, email, permission);
    };

    const handleUnshareSubmit = async (patientId, shareUserId) => {
        await unsharePatient(patientId, shareUserId);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            birthDate: '',
            phone: '',
            bloodType: '',
            allergies: '',
            condition: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            observations: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            emergency_contact_email: ''
        });
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const handleCepChange = (e) => {
        const formatted = formatCep(e.target.value);
        setFormData({ ...formData, cep: formatted });
    };

    const handleCepBlur = async () => {
        const cleanCep = formData.cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setLoadingCep(true);
            try {
                const address = await api.fetchAddressByCep(cleanCep);
                setFormData(prev => ({
                    ...prev,
                    street: address.street || '',
                    neighborhood: address.neighborhood || '',
                    city: address.city || '',
                    state: address.state || ''
                }));
                showToast('✓ Endereço encontrado com sucesso!', 'success');
            } catch (error) {
                showToast('CEP não encontrado. Verifique e tente novamente.', 'error');
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            showToast('Você precisa fazer login primeiro!', 'error');
            return;
        }

        if (!formData.name.trim()) {
            showToast('Nome é obrigatório', 'error');
            return;
        }

        if (!formData.birthDate) {
            showToast('Data de nascimento é obrigatória', 'error');
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await updatePatient(editingId, formData);
            } else {
                await addPatient(formData);
            }
            handleCancel();
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Shimmer Components
    if (isPageLoading) {
        return (
            <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
                {/* Header Shimmer */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>

                {/* Search Shimmer */}
                <div className="relative">
                    <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>

                {/* List Shimmer */}
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-32 border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-center p-6 gap-6 h-full">
                                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between">
                                        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                        <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col gap-2 w-32">
                                    <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                    <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pacientes</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os pacientes cadastrados.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus size={18} className="mr-2" /> Novo Paciente
                    </Button>
                )}
            </div>

            {!showForm && patients.length > 0 && (
                <div className="relative">
                    <label htmlFor="patient-search" className="sr-only">Buscar paciente</label>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        id="patient-search"
                        name="search"
                        autoComplete="off"
                        type="text"
                        placeholder="Buscar por nome ou condição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    />
                </div>
            )}

            {showForm && (
                <Card className="border-none shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-500 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-4 sm:px-8">
                        <div className="flex flex-col gap-5">
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
                                        <User className="text-primary" size={24} />
                                    </div>
                                    <span className="truncate">{editingId ? 'Editar Paciente' : 'Novo Paciente'}</span>
                                </h3>

                                <div className="flex items-center gap-2 sm:ml-auto">
                                    {editingId && (
                                        <button
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-bold text-sm border border-indigo-100 shadow-sm whitespace-nowrap"
                                            onClick={() => handleShareClick(patients.find(p => p.id === editingId))}
                                        >
                                            <Share2 size={16} className="shrink-0" />
                                            <span>Compartilhar</span>
                                        </button>
                                    )}

                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="w-full h-px bg-slate-100" />
                                <p className="text-slate-500 font-medium text-sm italic border-l-4 border-primary/20 pl-3 py-1">
                                    Mantenha os dados de saúde sempre atualizados para um melhor acompanhamento.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Secção 1: Identificação */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Identificação Básica</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Nome Completo"
                                        id="patientName"
                                        name="name"
                                        autoComplete="name"
                                        placeholder="Ex: Maria Silva"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        containerClassName="md:col-span-2"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        id="patientEmail"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="ex: maria@email.com"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <div className="flex gap-4">
                                        <Input
                                            label="Telefone"
                                            id="patientPhone"
                                            name="phone"
                                            autoComplete="tel"
                                            placeholder="(00) 00000-0000"
                                            containerClassName="flex-1"
                                            value={formatPhone(formData.phone || '')}
                                            onChange={handlePhoneChange}
                                            maxLength={15}
                                        />
                                        <div className="flex flex-col gap-1.5 w-32">
                                            <label htmlFor="patientBloodType" className="text-sm font-semibold text-slate-700 ml-1">Sangue</label>
                                            <select
                                                id="patientBloodType"
                                                name="bloodType"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-medium"
                                                value={formData.bloodType || ''}
                                                onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                                            >
                                                <option value="">Selecione...</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-end">
                                        <Input
                                            label="Data de Nascimento"
                                            type="date"
                                            id="patientBirthDate"
                                            name="birthDate"
                                            autoComplete="bday"
                                            containerClassName="flex-1"
                                            value={formData.birthDate}
                                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                            required
                                        />
                                        {formData.birthDate && (
                                            <div className="pb-3 pr-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                                                    <Calendar size={14} />
                                                    {formatAge(formData.birthDate)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Secção 2: Saúde */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Informações de Saúde</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Condição Principal"
                                        id="patientCondition"
                                        name="condition"
                                        placeholder="Ex: Hipertensão, Diabetes..."
                                        value={formData.condition}
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    />
                                    <Input
                                        label="Alergias (SOS)"
                                        id="patientAllergies"
                                        name="allergies"
                                        placeholder="Ex: Dipirona, Penicilina..."
                                        value={formData.allergies}
                                        onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Secção 3: Endereço */}
                            <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-2 pb-2">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Localização</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <Input
                                        label={loadingCep ? "CEP (buscando...)" : "CEP"}
                                        id="patientCep"
                                        name="cep"
                                        autoComplete="postal-code"
                                        placeholder="00000-000"
                                        value={formData.cep}
                                        onChange={handleCepChange}
                                        onBlur={handleCepBlur}
                                        maxLength={9}
                                        containerClassName="md:col-span-4"
                                    />
                                    <Input
                                        label="Logradouro"
                                        id="patientStreet"
                                        name="street"
                                        autoComplete="address-line1"
                                        placeholder="Rua, Avenida..."
                                        containerClassName="md:col-span-6"
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        disabled={loadingCep}
                                    />
                                    <Input
                                        label="Núm."
                                        id="patientNumber"
                                        name="number"
                                        autoComplete="off"
                                        placeholder="123"
                                        containerClassName="md:col-span-2"
                                        value={formData.number}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    />
                                    <Input
                                        label="Complemento"
                                        id="patientComplement"
                                        name="complement"
                                        autoComplete="off"
                                        placeholder="Apto, Bloco..."
                                        containerClassName="md:col-span-3"
                                        value={formData.complement}
                                        onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                    />
                                    <Input
                                        label="Bairro"
                                        id="patientNeighborhood"
                                        name="neighborhood"
                                        autoComplete="address-line2"
                                        placeholder="Centro"
                                        containerClassName="md:col-span-4"
                                        value={formData.neighborhood}
                                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                        disabled={loadingCep}
                                    />
                                    <Input
                                        label="Cidade"
                                        id="patientCity"
                                        name="city"
                                        autoComplete="address-level2"
                                        placeholder="São Paulo"
                                        containerClassName="md:col-span-3"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        disabled={loadingCep}
                                    />
                                    <Input
                                        label="UF"
                                        id="patientState"
                                        name="state"
                                        autoComplete="address-level1"
                                        placeholder="SP"
                                        containerClassName="md:col-span-2"
                                        maxLength={2}
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        disabled={loadingCep}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label htmlFor="patientObs" className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <FileText size={16} /> Observações Adicionais
                                </label>
                                <textarea
                                    id="patientObs"
                                    name="observations"
                                    className="w-full px-5 py-4 rounded-[1.5rem] border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 resize-none font-medium shadow-inner"
                                    placeholder="Histórico médico, cuidados especiais, preferências..."
                                    rows={4}
                                    value={formData.observations || ''}
                                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                />
                            </div>

                            {/* Secção 4: Emergência */}
                            <div className="bg-rose-50/50 p-8 rounded-[2rem] border border-rose-100/50 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-rose-600 uppercase tracking-tighter text-sm flex items-center gap-2">
                                        <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>
                                        🚨 Contato de Emergência (Botão de Pânico)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Nome do Contato"
                                        id="patientEmName"
                                        name="emName"
                                        placeholder="Ex: Cônjuge, Filho, Vizinho..."
                                        value={formData.emergency_contact_name || ''}
                                        onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                    />
                                    <Input
                                        label="Telefone (WhatsApp)"
                                        id="patientEmPhone"
                                        name="emPhone"
                                        placeholder="(00) 00000-0000"
                                        value={formatPhone(formData.emergency_contact_phone || '')}
                                        onChange={e => setFormData({ ...formData, emergency_contact_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                    />
                                    <Input
                                        label="Email para alertas SOS"
                                        type="email"
                                        id="patientEmEmail"
                                        name="emEmail"
                                        placeholder="Email para receber o mapa de localização"
                                        containerClassName="md:col-span-2"
                                        value={formData.emergency_contact_email || ''}
                                        onChange={e => setFormData({ ...formData, emergency_contact_email: e.target.value })}
                                    />
                                    <p className="text-[10px] text-rose-400 font-bold italic md:col-span-2 uppercase text-center mt-2">
                                        * Este contato receberá a localização exata do paciente em caso de emergência.
                                    </p>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleCancel}
                                    className="flex-1 py-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold text-base rounded-2xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-black text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Paciente')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!showForm && (
                <>
                    {patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                <User size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Nenhum paciente cadastrado</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-6">Comece adicionando um paciente para gerenciar suas receitas e medicamentos.</p>
                            <Button variant="outline" onClick={() => setShowForm(true)}>
                                <Plus size={18} className="mr-2" /> Novo Paciente
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                {paginatedPatients.map(patient => {
                                    const age = formatAge(patient.birthDate);
                                    const fullAddress = [
                                        patient.street,
                                        patient.number,
                                        patient.neighborhood,
                                        patient.city,
                                        patient.state
                                    ].filter(Boolean).join(', ');

                                    // Simplified: Buttons always visible. Permissions handled by Backend/RLS.
                                    return (
                                        <Card key={patient.id} className="group hover:border-primary/30">
                                            <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <User size={32} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-bold text-xl text-slate-900 truncate">{patient.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            {(patient.is_self || patient.isSelf) && (
                                                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                                                                    Próprio
                                                                </span>
                                                            )}
                                                            <ChevronRight size={20} className="text-slate-300 md:hidden" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                                                        {age && (
                                                            <>
                                                                <span className="bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-600 flex items-center gap-1">
                                                                    <Calendar size={14} />
                                                                    {age}
                                                                </span>
                                                            </>
                                                        )}
                                                        {patient.bloodType && (
                                                            <span className="bg-red-50 px-2.5 py-0.5 rounded-md font-bold text-red-600 border border-red-100 flex items-center gap-1">
                                                                <span className="text-xs">🩸</span>
                                                                {patient.bloodType}
                                                            </span>
                                                        )}
                                                        {patient.condition && (
                                                            <>
                                                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                                                <span className="font-medium text-primary">{patient.condition}</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {patient.allergies && (
                                                        <div className="mb-2">
                                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                                                ⚠️ Alergias: {patient.allergies}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {fullAddress && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 truncate">
                                                            <MapPin size={16} className="shrink-0" />
                                                            <span className="truncate">{fullAddress}</span>
                                                        </div>
                                                    )}

                                                    {patient.email && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                                            <Mail size={16} className="shrink-0" />
                                                            <span>{patient.email}</span>
                                                        </div>
                                                    )}

                                                    {patient.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                                            <Phone size={16} className="shrink-0" />
                                                            <span>{patient.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-4 md:mt-0 md:ml-auto justify-center md:justify-end">
                                                    {/* Logic for permissions */}
                                                    {(() => {
                                                        const isOwner = patient.userId === user?.id;
                                                        const myShare = !isOwner && patient.sharedWith?.find(s =>
                                                            s.email === user?.email
                                                        );
                                                        const canEdit = isOwner || myShare?.permission === 'edit';

                                                        return (
                                                            <>
                                                                {/* Share: Only Owner can share */}
                                                                {isOwner && (
                                                                    <button
                                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors text-xs font-bold"
                                                                        onClick={() => handleShareClick(patient)}
                                                                    >
                                                                        <Share2 size={14} />
                                                                        <span>Compartilhar</span>
                                                                    </button>
                                                                )}

                                                                {canEdit ? (
                                                                    <>
                                                                        <button
                                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors text-xs font-medium"
                                                                            onClick={() => navigate('/appointments', { state: { patientId: patient.id } })}
                                                                        >
                                                                            <Calendar size={14} />
                                                                            <span>Agendar</span>
                                                                        </button>
                                                                        <button
                                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium"
                                                                            onClick={() => handleEdit(patient)}
                                                                        >
                                                                            <Edit2 size={14} />
                                                                            <span>Editar</span>
                                                                        </button>
                                                                        {isOwner && !(patient.is_self || patient.isSelf) && (
                                                                            <button
                                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs font-medium"
                                                                                onClick={() => handleDeleteClick(patient)}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                                <span>Excluir</span>
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 border border-slate-200 px-3 py-1 rounded-full flex items-center">
                                                                        <User size={12} className="mr-1" /> Leitura
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />


                            <ConfirmationModal
                                isOpen={!!patientToDelete}
                                onClose={() => setPatientToDelete(null)}
                                onConfirm={confirmDelete}
                                title="Excluir Paciente"
                                description={
                                    patientToDelete ? (
                                        <span>
                                            Tem certeza que deseja excluir o paciente:
                                            <br /><br />
                                            <strong className="text-slate-900 block font-bold text-lg leading-tight">
                                                {patientToDelete.name}
                                            </strong>
                                            <br />
                                            <span className="block text-red-600 font-medium">
                                                Isso removerá também todas as receitas, histórico e diário de saúde.
                                                <br />
                                                Essa ação não pode ser desfeita.
                                            </span>
                                        </span>
                                    ) : "Tem certeza que deseja excluir este paciente?"
                                }
                            />

                            {/* Share Modal */}
                            {sharingPatientId && (
                                <ShareModal
                                    isOpen={!!sharingPatientId}
                                    onClose={() => setSharingPatientId(null)}
                                    patient={patients.find(p => p.id === sharingPatientId)}
                                    onShare={handleShareSubmit}
                                    onUnshare={(patientId, shareUserId) => handleUnshareSubmit(patientId, shareUserId)}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Patients;
