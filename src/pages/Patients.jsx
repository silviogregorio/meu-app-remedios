import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Plus, User, Edit2, Trash2, X, Search, ChevronRight, Calendar, Phone, Mail, Share2, MapPin } from 'lucide-react';
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
    const { patients, addPatient, updatePatient, deletePatient, sharePatient, unsharePatient, showToast, user } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [sharingPatientId, setSharingPatientId] = useState(null); // ID of patient being shared
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        birthDate: '',
        phone: '',
        condition: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        observations: ''
    });
    const [loadingCep, setLoadingCep] = useState(false);

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

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deletePatient(deleteId);
            setDeleteId(null);
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
            condition: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            observations: ''
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou condição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    />
                </div>
            )}

            {showForm && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">
                                {editingId ? 'Editar Paciente' : 'Novo Paciente'}
                            </h3>
                            <p className="text-sm text-slate-500">Preencha os dados do paciente</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {editingId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mr-2"
                                    onClick={() => handleShareClick(patients.find(p => p.id === editingId))}
                                >
                                    <Share2 size={18} className="mr-2" /> Compartilhar
                                </Button>
                            )}
                            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <Input
                                label="Nome Completo"
                                placeholder="Ex: Maria Silva"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <Input
                                label="Email"
                                type="email"
                                placeholder="ex: maria@email.com"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                            <div className="flex gap-6">
                                <Input
                                    label="Data de Nascimento"
                                    type="date"
                                    containerClassName="w-1/2"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex gap-6">
                                <Input
                                    label="Telefone"
                                    placeholder="(00) 00000-0000"
                                    containerClassName="w-1/2"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={15}
                                />
                                <Input
                                    label="Condição Principal"
                                    placeholder="Ex: Hipertensão"
                                    containerClassName="w-1/2"
                                    value={formData.condition}
                                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                />
                            </div>

                            <Input
                                label={loadingCep ? "CEP (buscando...)" : "CEP"}
                                placeholder="00000-000"
                                value={formData.cep}
                                onChange={handleCepChange}
                                onBlur={handleCepBlur}
                                maxLength={9}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Input
                                    label="Logradouro"
                                    placeholder="Rua, Avenida..."
                                    containerClassName="md:col-span-3"
                                    value={formData.street}
                                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    disabled={loadingCep}
                                />
                                <Input
                                    label="Número"
                                    placeholder="123"
                                    containerClassName="md:col-span-1"
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Complemento"
                                    placeholder="Apto, Bloco..."
                                    containerClassName="md:col-span-1"
                                    value={formData.complement}
                                    onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                />
                                <Input
                                    label="Bairro"
                                    placeholder="Centro"
                                    containerClassName="md:col-span-2"
                                    value={formData.neighborhood}
                                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                    disabled={loadingCep}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Input
                                    label="Cidade"
                                    placeholder="São Paulo"
                                    containerClassName="md:col-span-3"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    disabled={loadingCep}
                                />
                                <Input
                                    label="UF"
                                    placeholder="SP"
                                    containerClassName="md:col-span-1"
                                    maxLength={2}
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                    disabled={loadingCep}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Observações</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                                    placeholder="Informações adicionais sobre o paciente..."
                                    rows={3}
                                    value={formData.observations || ''}
                                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 mt-4 pt-6 border-t border-slate-50">
                                <Button type="button" variant="ghost" onClick={handleCancel} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" disabled={submitting}>
                                    {submitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Paciente')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                        <User size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Nenhum paciente cadastrado</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-6">Comece adicionando um paciente para gerenciar suas receitas e medicamentos.</p>
                    <Button variant="outline" onClick={() => setShowForm(true)}>
                        Adicionar Primeiro Paciente
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
                                                <ChevronRight size={20} className="text-slate-300 md:hidden" />
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
                                                {patient.condition && (
                                                    <>
                                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                                        <span className="font-medium text-primary">{patient.condition}</span>
                                                    </>
                                                )}
                                            </div>

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

                                        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 md:ml-auto">
                                            {/* Logic for permissions */}
                                            {(() => {
                                                const isOwner = patient.userId === user?.id;
                                                const myShare = !isOwner && patient.sharedWith?.find(s =>
                                                    s.email === user?.email
                                                );
                                                const canEdit = isOwner || myShare?.permission === 'edit';

                                                return (
                                                    <>
                                                        {/* Share: Only Owner can share (usually) or maybe Editor? Let's restrict to Owner for now or check requirements. Assuming Owner only. */}
                                                        {isOwner && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                                onClick={() => handleShareClick(patient)}
                                                            >
                                                                <Share2 size={18} className="mr-2" /> Compartilhar
                                                            </Button>
                                                        )}

                                                        {canEdit && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="justify-start text-slate-600 hover:text-primary"
                                                                    onClick={() => handleEdit(patient)}
                                                                >
                                                                    <Edit2 size={18} className="mr-2" /> Editar
                                                                </Button>
                                                                {/* Helper logic: Usually only Owner deletes, but if 'edit' implies full management... 
                                                                    Let's allow Delete if Can Edit, OR restrict Delete to Owner. 
                                                                    Safe bet: Restrict Delete to Owner to avoid accidents. */}
                                                                {isOwner && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                                        onClick={() => handleDeleteClick(patient.id)}
                                                                    >
                                                                        <Trash2 size={18} className="mr-2" /> Excluir
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                        {!canEdit && (
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


                    <Modal
                        isOpen={!!deleteId}
                        onClose={() => setDeleteId(null)}
                        title="Excluir Paciente"
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
                                Tem certeza que deseja excluir este paciente?
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                Essa ação não pode ser desfeita e removerá todo o histórico.
                            </p>
                        </div>
                    </Modal>

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
        </div>
    );
};

export default Patients;
