import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import {
    Loader2, Plus, Pencil, Trash2, X, Save, Upload, ExternalLink,
    MapPin, Search, AlertTriangle, Tag, Eye, EyeOff, Globe,
    CheckCircle2, Ban, Instagram, Facebook, Youtube, Video, MessageCircle, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCitiesByState, filterCities } from '../services/cityService';
import ManageOffersModal from '../components/features/ManageOffersModal';
import OfferReportModal from '../components/features/OfferReportModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import clsx from 'clsx';

const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const AdminSponsors = () => {
    const { user } = useAuth();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [sponsorToDelete, setSponsorToDelete] = useState(null);
    const [selectedSponsorForOffers, setSelectedSponsorForOffers] = useState(null);
    const [selectedSponsorForReport, setSelectedSponsorForReport] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedUF, setSelectedUF] = useState('SP');
    const [cityList, setCityList] = useState([]);
    const [citySearch, setCitySearch] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        website_url: '',
        logo_url: '',
        description: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        youtube: '',
        active: true,
        show_on_landing_page: true,
        ibge_code: '',
        city: '',
        state: 'SP'
    });
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        if (user) fetchSponsors();
    }, [user]);

    useEffect(() => {
        const loadCities = async () => {
            if (selectedUF) {
                try {
                    const cities = await fetchCitiesByState(selectedUF);
                    setCityList(cities);
                } catch (error) {
                    showToast('Erro ao carregar cidades', 'error');
                }
            }
        };
        loadCities();
    }, [selectedUF]);

    useEffect(() => {
        setFilteredCities(filterCities(cityList, citySearch));
    }, [citySearch, cityList]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSponsors = async () => {
        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSponsors(data || []);
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            showToast('Erro ao carregar patrocinadores', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const uploadLogo = async () => {
        if (!logoFile) return formData.logo_url;

        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('sponsors')
            .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('sponsors').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.city || !formData.ibge_code) {
            showToast('Selecione uma cidade válida na lista', 'error');
            return;
        }

        setUploading(true);

        try {
            const logoUrl = await uploadLogo();

            const sponsorData = {
                name: formData.name,
                website_url: formData.website_url,
                logo_url: logoUrl,
                description: formData.description,
                whatsapp: formData.whatsapp,
                instagram: formData.instagram,
                facebook: formData.facebook,
                tiktok: formData.tiktok,
                youtube: formData.youtube,
                active: formData.active,
                show_on_landing_page: formData.show_on_landing_page,
                ibge_code: formData.ibge_code,
                city: formData.city,
                state: formData.state
            };

            if (editingId) {
                const { error } = await supabase
                    .from('sponsors')
                    .update(sponsorData)
                    .eq('id', editingId);

                if (error) throw error;
                showToast('Patrocinador atualizado!');
                setSponsors(sponsors.map(s => s.id === editingId ? { ...s, ...sponsorData } : s));
            } else {
                const { data, error } = await supabase
                    .from('sponsors')
                    .insert([sponsorData])
                    .select();

                if (error) throw error;
                showToast('Patrocinador criado!');
                setSponsors([data[0], ...sponsors]);
            }

            handleCancel();
        } catch (error) {
            console.error('Error saving sponsor:', error);
            showToast('Erro ao salvar patrocinador', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (sponsor) => {
        setEditingId(sponsor.id);
        setSelectedUF(sponsor.state || 'SP');
        setCitySearch(sponsor.city || '');

        setFormData({
            ...sponsor,
            whatsapp: sponsor.whatsapp || '',
            instagram: sponsor.instagram || '',
            facebook: sponsor.facebook || '',
            tiktok: sponsor.tiktok || '',
            youtube: sponsor.youtube || '',
            show_on_landing_page: sponsor.show_on_landing_page !== false
        });

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            name: '', website_url: '', logo_url: '', description: '',
            whatsapp: '', instagram: '', facebook: '', tiktok: '', youtube: '',
            active: true, show_on_landing_page: true, ibge_code: '', city: '', state: 'SP'
        });
        setLogoFile(null);
        setCitySearch('');
    };

    const handleDeleteClick = (sponsor) => {
        setSponsorToDelete(sponsor);
    };

    const confirmDelete = async () => {
        if (!sponsorToDelete) return;

        try {
            const { error } = await supabase
                .from('sponsors')
                .delete()
                .eq('id', sponsorToDelete.id);

            if (error) throw error;

            showToast('Patrocinador removido', 'success');
            setSponsors(sponsors.filter(s => s.id !== sponsorToDelete.id));
            setSponsorToDelete(null);
        } catch (error) {
            console.error('Error deleting sponsor:', error);
            showToast('Erro ao remover patrocinador', 'error');
        }
    };

    const openOffersModal = (sponsor) => {
        setSelectedSponsorForOffers(sponsor);
    };

    if (loading) return <div className="flex justify-center p-20 min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    if (user?.email !== 'sigsis@gmail.com') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800">Acesso Negado</h2>
                <Button className="mt-4" onClick={() => window.history.back()}>Voltar</Button>
            </div>
        );
    }

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSponsors = sponsors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sponsors.length / itemsPerPage);

    return (
        <div className="flex flex-col gap-8 animate-in fade-in pb-24 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Parceiros & Patrocinadores</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-bold">
                        <div className="p-1 px-2 bg-slate-100 rounded text-slate-400 shrink-0">
                            <Globe size={14} />
                        </div>
                        <p className="text-sm">Gerencie a visibilidade e ofertas por região.</p>
                    </div>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { handleCancel(); setShowForm(true); }}
                        className="w-full md:w-auto group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Plus size={22} className="group-hover:rotate-90 transition-transform" />
                        <span>Novo Parceiro</span>
                    </button>
                )}
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {editingId ? <Pencil size={20} className="text-blue-500" /> : <Plus size={20} className="text-green-500" />}
                            {editingId ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
                        </h2>
                        <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Location Box */}
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/80">
                                <h3 className="font-bold text-blue-900 flex items-center mb-4 text-sm uppercase tracking-wide">
                                    <MapPin size={16} className="mr-2" />
                                    Localização (Segmentação)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Estado</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-700 bg-white"
                                            value={selectedUF}
                                            onChange={(e) => {
                                                setSelectedUF(e.target.value);
                                                setFormData(prev => ({ ...prev, state: e.target.value, city: '', ibge_code: '' }));
                                                setCitySearch('');
                                            }}
                                        >
                                            {ESTADOS_BRASIL.map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-9 relative" ref={dropdownRef}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cidade</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 pl-10 rounded-xl border ${formData.ibge_code ? 'border-green-500 bg-green-50/50 text-green-800 font-medium' : 'border-slate-200'} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:font-normal`}
                                                placeholder="Digite para buscar..."
                                                value={citySearch}
                                                onChange={(e) => {
                                                    setCitySearch(e.target.value);
                                                    setShowCityDropdown(true);
                                                    if (e.target.value !== formData.city) {
                                                        setFormData(prev => ({ ...prev, ibge_code: '' }));
                                                    }
                                                }}
                                                onFocus={() => setShowCityDropdown(true)}
                                            />
                                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        </div>
                                        {formData.ibge_code && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold">
                                                <CheckCircle2 size={12} />
                                                IBGE: {formData.ibge_code}
                                            </div>
                                        )}

                                        {showCityDropdown && filteredCities.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                                                {filteredCities.map(city => (
                                                    <button
                                                        key={city.ibge_code}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex justify-between items-center group transition-colors"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                city: city.name,
                                                                state: selectedUF,
                                                                ibge_code: city.ibge_code
                                                            });
                                                            setCitySearch(city.name);
                                                            setShowCityDropdown(false);
                                                        }}
                                                    >
                                                        <span className="text-slate-700 font-medium group-hover:text-blue-700">{city.name}</span>
                                                        <span className="text-xs text-slate-400 font-mono">IBGE {city.ibge_code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <Input
                                        label="Nome da Empresa"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: Drogaria São Paulo"
                                        className="h-12"
                                    />
                                    <Input
                                        label="Website Oficial"
                                        value={formData.website_url}
                                        onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                                        placeholder="https://..."
                                        icon={<Globe size={18} />}
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Sobre a Empresa</label>
                                        <textarea
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[140px] resize-none text-slate-600"
                                            placeholder="Descreva os serviços, horário de atendimento e diferenciais..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Logomarca</label>
                                        <div className="group border-2 border-dashed border-slate-300 rounded-2xl h-[240px] flex flex-col items-center justify-center relative hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer overflow-hidden bg-white">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            {logoFile ? (
                                                <div className="text-center p-4">
                                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                                        <Upload size={24} />
                                                    </div>
                                                    <p className="font-bold text-slate-700 truncate max-w-[200px]">{logoFile.name}</p>
                                                    <p className="text-xs text-blue-500 mt-1">Clique para trocar</p>
                                                </div>
                                            ) : formData.logo_url ? (
                                                <div className="flex flex-col items-center w-full h-full p-6">
                                                    <img src={formData.logo_url} className="h-full object-contain mb-2 group-hover:scale-105 transition-transform" alt="Logo" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white font-bold flex items-center gap-2"><Pencil size={16} /> Alterar Logo</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-400">
                                                    <Upload size={40} className="mx-auto mb-3 opacity-50" />
                                                    <p className="font-medium">Arraste ou clique para enviar</p>
                                                    <p className="text-xs mt-1">PNG, JPG ou SVG</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Visibilidade</h4>
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm h-auto min-h-[64px]">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${formData.active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {formData.active ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className="font-bold text-slate-800 block text-sm leading-tight">Status Conta</span>
                                                        <span className="text-xs text-slate-500 block mt-0.5">{formData.active ? 'Ativo' : 'Suspenso'}</span>
                                                    </div>
                                                </div>
                                                <div className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors relative ml-1 ${formData.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 left-1 ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </div>
                                                <input type="checkbox" className="hidden" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                            </label>

                                            <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm h-auto min-h-[64px]">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${formData.show_on_landing_page ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {formData.show_on_landing_page ? <Eye size={20} /> : <EyeOff size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className="font-bold text-slate-800 block text-sm leading-tight">Landing Page</span>
                                                        <span className="text-xs text-slate-500 block mt-0.5">{formData.show_on_landing_page ? 'Visível' : 'Oculto'}</span>
                                                    </div>
                                                </div>
                                                <div className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors relative ml-1 ${formData.show_on_landing_page ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 left-1 ${formData.show_on_landing_page ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </div>
                                                <input type="checkbox" className="hidden" checked={formData.show_on_landing_page} onChange={e => setFormData({ ...formData, show_on_landing_page: e.target.checked })} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <MessageCircle size={18} />
                                    Redes Sociais & Contato
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Input
                                        label="WhatsApp"
                                        placeholder="Ex: (11) 99999-9999"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        icon={<MessageCircle size={16} />}
                                    />
                                    <Input
                                        label="Instagram"
                                        placeholder="https://instagram.com/..."
                                        value={formData.instagram}
                                        onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                        icon={<Instagram size={16} />}
                                    />
                                    <Input
                                        label="Facebook"
                                        placeholder="https://facebook.com/..."
                                        value={formData.facebook}
                                        onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                        icon={<Facebook size={16} />}
                                    />
                                    <Input
                                        label="TikTok"
                                        placeholder="https://tiktok.com/..."
                                        value={formData.tiktok}
                                        onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                                        icon={<Video size={16} />}
                                    />
                                    <Input
                                        label="YouTube"
                                        placeholder="https://youtube.com/..."
                                        value={formData.youtube}
                                        onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                                        icon={<Youtube size={16} />}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={handleCancel} className="w-full md:w-auto px-6 py-4 rounded-xl">Cancelar</Button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl shadow-xl shadow-green-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {!showForm && (
                <>
                    <div className="space-y-4">
                        {/* Desktop View - Table */}
                        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Parceiro</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Localização</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentSponsors.map(sponsor => (
                                            <tr key={sponsor.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-tight">{sponsor.name}</p>
                                                        {sponsor.show_on_landing_page && (
                                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-tighter">Landing Page</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    {sponsor.city ? `${sponsor.city} - ${sponsor.state}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedSponsorForReport(sponsor)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Relatório"
                                                        >
                                                            <BarChart3 size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => openOffersModal(sponsor)}
                                                            className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                                                            title="Ofertas"
                                                        >
                                                            <Tag size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(sponsor)}
                                                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(sponsor)}
                                                            className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile View - Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {currentSponsors.map(sponsor => (
                                <div key={sponsor.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{sponsor.name}</h3>
                                            {sponsor.show_on_landing_page && (
                                                <span className="inline-block mt-1 text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Landing Page</span>
                                            )}
                                        </div>
                                        <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${sponsor.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {sponsor.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                            {sponsor.active ? 'Ativo' : 'Inativo'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <MapPin size={16} className="text-blue-500 shrink-0" />
                                        <span className="truncate">{sponsor.city ? `${sponsor.city} - ${sponsor.state}` : 'Localização não definida'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                                        <button
                                            onClick={() => setSelectedSponsorForReport(sponsor)}
                                            className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                                        >
                                            <BarChart3 size={16} /> Relatório
                                        </button>
                                        <button
                                            onClick={() => openOffersModal(sponsor)}
                                            className="flex items-center justify-center gap-2 py-3 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-100 transition-colors"
                                        >
                                            <Tag size={16} /> Ofertas
                                        </button>
                                        <button
                                            onClick={() => handleEdit(sponsor)}
                                            className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                                        >
                                            <Pencil size={16} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(sponsor)}
                                            className="flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-100 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} /> Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-3 disabled:opacity-50"
                            >
                                Anterior
                            </Button>
                            <span className="text-slate-600 font-bold text-sm bg-slate-100 px-4 py-2 rounded-lg">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-3 disabled:opacity-50"
                            >
                                Próxima
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {sponsors.length === 0 && (
                        <div className="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Globe size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Sem parceiros por aqui</h3>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">Comece cadastrando farmácias e parceiros para exibir ofertas aos usuários da plataforma.</p>
                        </div>
                    )}
                </>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!sponsorToDelete}
                onClose={() => setSponsorToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Parceiro"
                description={
                    sponsorToDelete ? (
                        <span>
                            Tem certeza que deseja excluir o parceiro:
                            <br /><br />
                            <strong className="text-slate-900 block font-bold text-lg leading-tight">
                                {sponsorToDelete.name}
                            </strong>
                            <br />
                            <span className="block text-red-600 font-medium">
                                Isso apagará todas as ofertas vinculadas.
                                <br />
                                Essa ação não pode ser desfeita.
                            </span>
                        </span>
                    ) : "Tem certeza?"
                }
            />

            {/* Offers Modal */}
            {selectedSponsorForOffers && (
                <ManageOffersModal
                    sponsor={selectedSponsorForOffers}
                    onClose={() => setSelectedSponsorForOffers(null)}
                />
            )}

            {/* Report Modal */}
            {selectedSponsorForReport && (
                <OfferReportModal
                    sponsor={selectedSponsorForReport}
                    onClose={() => setSelectedSponsorForReport(null)}
                />
            )}
        </div>
    );
};

export default AdminSponsors;
