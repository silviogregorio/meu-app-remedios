import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, X, Save, Loader2, Image as ImageIcon, ExternalLink, Eye, MousePointerClick, Pencil, Check, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { OfferService } from '../../services/offerService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';

const ManageOffersModal = ({ sponsor, onClose }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Helper to get Local "YYYY-MM-DDTHH:mm" string for inputs
    const getLocalISOString = (date = new Date()) => {
        const offsetMs = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offsetMs);
        return localDate.toISOString().slice(0, 16);
    };

    // Helper to display date in BRT
    const formatDateBRT = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // New Offer State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        original_price: '',
        image_url: '',
        whatsapp_link: '',
        active: true,
        starts_at: getLocalISOString(),
        expires_at: ''
    });
    const [uploading, setUploading] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, expired, scheduled
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const getFilteredOffers = () => {
        return offers.filter(offer => {
            const now = new Date();
            const start = offer.starts_at ? new Date(offer.starts_at) : null;
            const end = offer.expires_at ? new Date(offer.expires_at) : null;
            const isActive = offer.active;
            const isExpired = end && end < now;
            const isScheduled = start && start > now;

            // Search
            const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase());

            // Status
            let matchesStatus = true;
            if (filterStatus === 'active') matchesStatus = isActive && !isExpired && !isScheduled;
            if (filterStatus === 'inactive') matchesStatus = !isActive;
            if (filterStatus === 'expired') matchesStatus = isExpired;
            if (filterStatus === 'scheduled') matchesStatus = isScheduled;

            // Date Range (if set, checks if offer overlaps or is within)
            // Simple logic: created_at within range, OR start_date within range
            let matchesDate = true;
            if (filterDateStart) {
                matchesDate = matchesDate && new Date(offer.created_at) >= new Date(filterDateStart);
            }
            if (filterDateEnd) {
                matchesDate = matchesDate && new Date(offer.created_at) <= new Date(filterDateEnd);
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    };

    const filteredOffers = getFilteredOffers();

    useEffect(() => {
        loadOffers();
    }, [sponsor]);

    const loadOffers = async () => {
        try {
            const { data, error } = await supabase
                .from('ad_offers')
                .select('*')
                .eq('sponsor_id', sponsor.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers(data || []);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar ofertas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            if (editingId) {
                await OfferService.update(editingId, {
                    ...formData,
                    price: formData.price ? parseFloat(formData.price) : null,
                    original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                    starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
                    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
                });
            } else {
                await OfferService.create({
                    ...formData,
                    sponsor_id: sponsor.id,
                    price: formData.price ? parseFloat(formData.price) : null,
                    original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                    starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
                    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
                });
            }
            await loadOffers();
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar oferta');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
            price: '',
            original_price: '',
            image_url: '',
            whatsapp_link: '',
            active: true,
            starts_at: getLocalISOString(),
            expires_at: ''
        });
    };

    const handleEdit = (offer) => {
        setEditingId(offer.id);
        setFormData({
            title: offer.title,
            description: offer.description || '',
            price: offer.price || '',
            original_price: offer.original_price || '',
            image_url: offer.image_url || '',
            whatsapp_link: offer.whatsapp_link || '',
            active: offer.active,
            starts_at: offer.starts_at ? getLocalISOString(new Date(offer.starts_at)) : '',
            expires_at: offer.expires_at ? getLocalISOString(new Date(offer.expires_at)) : ''
        });
        setIsCreating(true);
    };

    const handleDelete = async (offer) => {
        if (window.confirm(`Tem certeza que deseja excluir a oferta "${offer.title}"? Esta ação não pode ser desfeita.`)) {
            try {
                await OfferService.delete(offer.id);
                loadOffers();
            } catch (error) {
                alert('Erro ao excluir');
            }
        }
    };

    // Toggle Active Status directly
    const handleToggleActive = async (offer) => {
        try {
            const newActive = !offer.active;
            // Optimistic update
            setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, active: newActive } : o));

            await OfferService.update(offer.id, { active: newActive });
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar status');
            loadOffers(); // Revert
        }
    };

    // Quick Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('sponsors') // Reuse sponsors bucket
                .upload(`offers/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('sponsors').getPublicUrl(`offers/${fileName}`);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error(error);
            alert('Erro no upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Ofertas: {sponsor.name}</h3>
                            <p className="text-xs text-slate-500">Gerencie produtos e promoções - Paginação Ativa</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

                    {/* Metrics Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Ofertas</p>
                            <p className="text-2xl font-bold text-slate-800">{offers.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><MousePointerClick size={12} /> Cliques Totais</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {offers.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><Eye size={12} /> Visualizações</p>
                            <p className="text-2xl font-bold text-slate-600">
                                {offers.reduce((acc, curr) => acc + (curr.views_count || 0), 0)}
                            </p>
                        </div>
                    </div>

                    {isCreating ? (
                        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 animate-in slide-in-from-top-4">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                {editingId ? <Pencil size={18} className="text-blue-500" /> : <Plus size={18} className="text-pink-500" />}
                                {editingId ? 'Editar Oferta' : 'Nova Oferta'}
                            </h4>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Título do Produto" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Dipirona 500mg" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Preço Original (R$)" type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({ ...formData, original_price: e.target.value })} placeholder="10.00" />
                                        <Input label="Preço Promocional (R$)" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="5.99" className="border-green-200 bg-green-50 font-bold text-green-700" />
                                    </div>
                                </div>

                                <Input label="Descrição Curta" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Cartela com 10 comprimidos" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Início da Oferta"
                                        type="datetime-local"
                                        value={formData.starts_at}
                                        onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Término (Opcional)"
                                        type="datetime-local"
                                        value={formData.expires_at}
                                        onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Foto do Produto</label>
                                        <div className="flex items-center gap-2">
                                            {formData.image_url && <img src={formData.image_url} className="w-10 h-10 rounded object-cover border" />}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <Input label="Link WhatsApp (Opcional)" value={formData.whatsapp_link} onChange={e => setFormData({ ...formData, whatsapp_link: e.target.value })} placeholder="Deixe vazio para usar o da farmácia" />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-700 block">Oferta Ativa</span>
                                        <span className="text-xs text-slate-500">Se desmarcado, não aparecerá para os clientes.</span>
                                    </div>
                                </label>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                        {editingId ? 'Salvar Alterações' : 'Criar Oferta'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 transition-all flex items-center justify-center gap-2 mb-6"
                        >
                            <Plus size={20} />
                            Adicionar Nova Oferta
                        </button>
                    )}

                    {/* Filters */}
                    {!isCreating && offers.length > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="active">Ativas</option>
                                    <option value="inactive">Inativas</option>
                                    <option value="scheduled">Agendadas</option>
                                    <option value="expired">Expiradas</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <Filter size={16} />
                                <span className="font-semibold">Período (Criação):</span>
                                <input
                                    type="date"
                                    value={filterDateStart}
                                    onChange={e => setFilterDateStart(e.target.value)}
                                    className="border rounded p-1"
                                />
                                <span>até</span>
                                <input
                                    type="date"
                                    value={filterDateEnd}
                                    onChange={e => setFilterDateEnd(e.target.value)}
                                    className="border rounded p-1"
                                />
                                {(filterDateStart || filterDateEnd) && (
                                    <button onClick={() => { setFilterDateStart(''); setFilterDateEnd(''); }} className="text-pink-500 text-xs hover:underline ml-2">
                                        Limpar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {loading ? <div className="text-center py-10"><Loader2 className="animate-spin text-pink-500" /></div> :
                            filteredOffers.length === 0 ? <p className="text-center text-slate-400 py-10">Nenhuma oferta encontrada.</p> :
                                <>
                                    {filteredOffers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(offer => {
                                        const now = new Date();
                                        const start = offer.starts_at ? new Date(offer.starts_at) : null;
                                        const end = offer.expires_at ? new Date(offer.expires_at) : null;
                                        const isActive = offer.active;

                                        let statusBadge = <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">ATIVA</span>;

                                        if (!isActive) {
                                            statusBadge = <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">INATIVA</span>;
                                        } else if (end && end < now) {
                                            statusBadge = <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">EXPIRADA</span>;
                                        } else if (start && start > now) {
                                            statusBadge = <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold text-nowrap">AGENDADA</span>;
                                        }

                                        return (
                                            <div key={offer.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 group hover:border-pink-200 transition-all relative">
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}

                                                    {/* Discount Badge on Card */}
                                                    {offer.original_price && offer.original_price > offer.price && (
                                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-1 rounded-bl-lg shadow-sm">
                                                            {Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)}%
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 w-full text-center md:text-left">
                                                    <h4 className="font-bold text-slate-800 line-clamp-1">{offer.title}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-1">{offer.description}</p>
                                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                                        {offer.original_price > offer.price && (
                                                            <span className="text-xs text-slate-400 line-through">{formatCurrency(offer.original_price)}</span>
                                                        )}
                                                        <span className="text-sm font-bold text-green-600">{formatCurrency(offer.price)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 min-w-[120px] text-right">
                                                    {statusBadge}
                                                    {isActive && (start || end) && (
                                                        <div className="text-[10px] text-slate-400 flex flex-col leading-tight mt-1">
                                                            {start && <span>De: {formatDateBRT(start)}</span>}
                                                            {end && <span>Até: {formatDateBRT(end)}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 border-l pl-4 shrink-0">
                                                    <div className="text-center">
                                                        <span className="block text-xs font-bold text-blue-600 uppercase">Cliques</span>
                                                        <span className="text-sm font-bold text-slate-700">{offer.clicks_count || 0}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-xs font-bold text-purple-600 uppercase">Visualizações</span>
                                                        <span className="text-sm font-bold text-slate-700">{offer.views_count || 0}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 ml-2">
                                                    <button onClick={() => handleEdit(offer)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(offer)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination Controls */}
                                    {Math.ceil(filteredOffers.length / itemsPerPage) > 1 && (
                                        <div className="flex justify-center items-center gap-4 pt-4">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className="text-sm font-medium text-slate-600">
                                                Página {currentPage} de {Math.ceil(filteredOffers.length / itemsPerPage)}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOffers.length / itemsPerPage), p + 1))}
                                                disabled={currentPage === Math.ceil(filteredOffers.length / itemsPerPage)}
                                                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                        }
                    </div>

                </div>
            </div>
        </div >
    );
};

export default ManageOffersModal;
