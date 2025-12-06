import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import { Loader2, Plus, Pencil, Trash2, X, Save, Upload, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSponsors = () => {
    const { user } = useAuth();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        website_url: '',
        logo_url: '',
        description: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        youtube: ''
    });
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        if (user) fetchSponsors();
    }, [user]);

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

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('sponsors').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                active: formData.active
            };

            if (editingId) {
                const { error } = await supabase
                    .from('sponsors')
                    .update(sponsorData)
                    .eq('id', editingId);

                if (error) throw error;
                showToast('Patrocinador atualizado com sucesso');
                setSponsors(sponsors.map(s => s.id === editingId ? { ...s, ...sponsorData } : s));
            } else {
                const { data, error } = await supabase
                    .from('sponsors')
                    .insert([sponsorData])
                    .select();

                if (error) throw error;
                showToast('Patrocinador adicionado com sucesso');
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
        setFormData({
            name: sponsor.name,
            website_url: sponsor.website_url || '',
            logo_url: sponsor.logo_url || '',
            description: sponsor.description || '',
            whatsapp: sponsor.whatsapp || '',
            instagram: sponsor.instagram || '',
            facebook: sponsor.facebook || '',
            tiktok: sponsor.tiktok || '',
            youtube: sponsor.youtube || '',
            active: sponsor.active
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
            active: true
        });
        setLogoFile(null);
    };

    const handleDelete = async (id, logoUrl) => {
        if (!confirm('Tem certeza que deseja remover este patrocinador?')) return;

        try {
            const { error } = await supabase
                .from('sponsors')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast('Patrocinador removido', 'success');
            setSponsors(sponsors.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting sponsor:', error);
            showToast('Erro ao remover patrocinador', 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (user?.email !== 'sigsis@gmail.com') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800">Acesso Negado</h2>
                <p className="text-slate-600">Esta área é restrita para administradores.</p>
                <Button className="mt-4" onClick={() => window.history.back()}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in pb-24 relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Gerenciar Parceiros</h2>
                    <p className="text-slate-500">Adicione e remova empresas parceiras da Landing Page.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => { setEditingId(null); setFormData({ name: '', website_url: '', logo_url: '', description: '', whatsapp: '', instagram: '', facebook: '', tiktok: '', youtube: '' }); setShowForm(true); }}>
                        <Plus size={20} className="mr-2" />
                        Novo Parceiro
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>{editingId ? 'Editar Parceiro' : 'Novo Cadastro'}</CardTitle>
                        <button onClick={handleCancel}><X size={24} className="text-slate-400" /></button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nome da Empresa"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Link do Site (Opcional)"
                                value={formData.website_url}
                                onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://"
                            />

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Descrição (Opcional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none min-h-[100px]"
                                    placeholder="Escreva um breve texto sobre o parceiro..."
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 text-right">Será exibido no card do parceiro</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Logo da Empresa</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {logoFile ? (
                                        <div className="text-center">
                                            <p className="font-semibold text-primary">{logoFile.name}</p>
                                            <p className="text-xs">Clique para alterar</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={32} className="mb-2" />
                                            <p>Clique ou arraste a imagem aqui</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <h4 className="md:col-span-2 text-sm font-bold text-slate-900">Redes Sociais e Contato</h4>

                                <Input
                                    label="WhatsApp (Link ou Número)"
                                    placeholder="https://wa.me/55..."
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                />
                                <Input
                                    label="Instagram (Link)"
                                    placeholder="https://instagram.com/..."
                                    value={formData.instagram}
                                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                />
                                <Input
                                    label="Facebook (Link)"
                                    placeholder="https://facebook.com/..."
                                    value={formData.facebook}
                                    onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                />
                                <Input
                                    label="TikTok (Link)"
                                    placeholder="https://tiktok.com/..."
                                    value={formData.tiktok}
                                    onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                                />
                                <Input
                                    label="YouTube (Link)"
                                    placeholder="https://youtube.com/..."
                                    value={formData.youtube}
                                    onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                                />

                                <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-900 block mb-1">Status do Parceiro</label>
                                        <p className="text-xs text-slate-500">Parceiros inativos não aparecem na Landing Page</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-700">{formData.active ? 'Ativo' : 'Inativo'}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={handleCancel}>Cancelar</Button>
                                <Button type="submit" disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                                    {editingId ? 'Atualizar' : 'Salvar Parceiro'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sponsors.map(sponsor => (
                    <Card key={sponsor.id} className="group hover:shadow-xl transition-all border-slate-200 overflow-hidden flex flex-col">
                        {/* Image Container - Larger */}
                        <div className="relative h-64 bg-slate-100 flex items-center justify-center p-8 border-b border-slate-100 group-hover:bg-white transition-colors">
                            <img
                                src={sponsor.logo_url}
                                alt={sponsor.name}
                                className="max-w-full max-h-full object-contain filter group-hover:brightness-110 transition-all duration-300 transform group-hover:scale-110"
                            />
                            {/* Overlay Actions on Hover */}
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    type="button"
                                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-md h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                                    onClick={() => handleEdit(sponsor)}
                                    title="Editar Parceiro"
                                >
                                    <Pencil size={20} color="#ffffff" strokeWidth={2} />
                                </button>
                                <button
                                    type="button"
                                    className="bg-red-600 text-white hover:bg-red-700 shadow-md h-12 w-12 rounded-full flex items-center justify-center ml-2 transition-all duration-300 hover:scale-110 cursor-pointer"
                                    onClick={() => handleDelete(sponsor.id, sponsor.logo_url)}
                                    title="Excluir Parceiro"
                                >
                                    <Trash2 size={20} color="#ffffff" strokeWidth={2} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                            <div className="mb-6 flex-1">
                                <h3 className="font-bold text-2xl text-slate-900 mb-2">{sponsor.name}</h3>
                                {sponsor.website_url ? (
                                    <a
                                        href={sponsor.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-slate-500 hover:text-primary flex items-center gap-1 transition-colors mb-4 inline-flex"
                                    >
                                        <ExternalLink size={14} />
                                        {sponsor.website_url}
                                    </a>
                                ) : (
                                    <span className="text-sm text-slate-400 mb-4 block">Sem website</span>
                                )}

                                {sponsor.description ? (
                                    <p className="text-slate-600 leading-relaxed text-base line-clamp-4 mt-2">
                                        {sponsor.description}
                                    </p>
                                ) : (
                                    <p className="text-slate-400 italic text-base mt-2">Sem descrição</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sponsor.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {sponsor.active ? 'ATIVO' : 'INATIVO'}
                                </span>
                                <span className="text-xs text-slate-400">
                                    Cadastrado em {new Date(sponsor.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AdminSponsors;
