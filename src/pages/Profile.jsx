import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { User, Settings, LogOut, Bell, LogIn, Database, Trash2, Mail, Phone, MapPin, Camera, Shield, Share2, Activity } from 'lucide-react';

const Profile = () => {
    const { user, logout, updateProfile } = useAuth(); // AuthContext for user/logout/updateProfile
    const { showToast, runCaregiverCheck } = useApp(); // AppContext for app features
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.user_metadata?.full_name || ''
    });

    const handleUpdateProfile = async () => {
        if (!editForm.name.trim()) {
            showToast('Nome é obrigatório', 'error');
            return;
        }
        await updateProfile(editForm);
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <User size={40} />
                </div>
                <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Faça Login</h2>
                <p className="text-[#64748b] dark:text-slate-400">Acesse sua conta para gerenciar seus dados e configurações.</p>
                <Button onClick={() => navigate('/login')} className="mt-4 w-full max-w-xs">
                    <LogIn size={20} className="mr-2" />
                    Entrar
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
            {/* User Header */}
            <div className="flex flex-col items-center gap-4 py-6">
                {user.user_metadata?.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || 'User'}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                        {user.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : 'U'}
                    </div>
                )}
                <div className="text-center">
                    <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">{user.user_metadata?.full_name || 'Usuário'}</h2>
                    <p className="text-[#64748b] dark:text-slate-400">{user.email}</p>
                </div>
            </div>

            {/* Caregiver Mode (Premium) Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                            <Activity className="text-amber-600 dark:text-amber-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">Modo Cuidador</h2>
                    </div>
                    <p className="text-amber-700/80 dark:text-amber-300/70 text-sm">
                        Ferramentas para quem cuida de idosos ou familiares remotamente.
                    </p>
                </div>
                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Bell className="text-slate-400 mt-1" size={20} />
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Verificação de Atrasos</h4>
                                <p className="text-sm text-slate-500 mb-3">
                                    Simule a verificação automática de remédios atrasados (mais de 30min).
                                    Se houver atrasos não notificados hoje, você receberá um email de alerta.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => runCaregiverCheck()}
                                    className="border-amber-200 hover:bg-amber-50 text-amber-900"
                                >
                                    Executar Verificação Agora
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Settings */}
            <div className="flex flex-col gap-4">
                <Card>
                    <CardContent className="p-0">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full flex items-center gap-4 p-4 border-b border-[#e2e8f0] dark:border-slate-800 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-400">
                                <User size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Dados Pessoais</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Alterar nome, email</p>
                            </div>
                        </button>
                    </CardContent>
                </Card>

                <Button variant="danger" onClick={async () => { await logout(); window.location.href = '/'; }} className="mt-4">
                    <LogOut size={20} className="mr-2" />
                    Sair do App
                </Button>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title="Editar Perfil"
            >
                <div className="flex flex-col gap-4">
                    <Input
                        label="Nome Completo"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Seu nome"
                    />

                    <div className="flex gap-3 mt-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateProfile} className="flex-1">
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Profile;
