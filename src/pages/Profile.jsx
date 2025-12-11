import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { User, Settings, LogOut, Bell, LogIn, Database, Trash2, Mail, Phone, MapPin, Camera, Shield, Share2, Activity } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth(); // AuthContext for user/logout
    const { showToast, runCaregiverCheck } = useApp(); // AppContext for app features
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        currentPassword: '' // Para validar alteração de email
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdateProfile = async () => {
        if (!editForm.name.trim()) {
            showToast('Nome é obrigatório', 'error');
            return;
        }

        // Se o email mudou, valida senha
        const emailChanged = editForm.email !== user?.email;

        if (emailChanged) {
            if (!editForm.currentPassword) {
                showToast('Digite sua senha para alterar o email', 'error');
                return;
            }

            // Valida a senha atual
            try {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: editForm.currentPassword
                });

                if (signInError) {
                    console.error('Erro de autenticação:', signInError);
                    showToast('❌ Senha incorreta! Verifique e tente novamente.', 'error');
                    return;
                }

                // Senha correta, atualiza o email
                const { error: updateError } = await supabase.auth.updateUser({
                    email: editForm.email
                });

                if (updateError) {
                    // Traduzir mensagens de erro do Supabase
                    let errorMessage = 'Erro ao alterar email';

                    if (updateError.message.includes('already registered') ||
                        updateError.message.includes('already exists') ||
                        updateError.message.includes('Email already in use')) {
                        errorMessage = '❌ Este email já está sendo usado por outra conta';
                    } else if (updateError.message.includes('rate limit')) {
                        errorMessage = '⏱️ Muitas tentativas. Aguarde alguns minutos e tente novamente';
                    } else if (updateError.message.includes('invalid')) {
                        errorMessage = '❌ Email inválido. Verifique e tente novamente';
                    } else {
                        errorMessage = `❌ Erro ao alterar email: ${updateError.message}`;
                    }

                    showToast(errorMessage, 'error');
                    return;
                }

                showToast('📧 Email de confirmação enviado!', 'success');
                showToast(`Verifique ${editForm.email} e clique no link para confirmar a mudança`, 'info');
                showToast('⚠️ Seu email só mudará após confirmação', 'warning');
            } catch (error) {
                showToast('Erro: ' + error.message, 'error');
                return;
            }
        }

        // Atualiza nome via Supabase
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: editForm.name }
            });

            if (error) {
                showToast('Erro ao atualizar nome: ' + error.message, 'error');
                return;
            }
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
            return;
        }

        setIsEditing(false);
        setEditForm({ ...editForm, currentPassword: '' }); // Limpa senha
        showToast('Perfil atualizado com sucesso!', 'success');
    };

    const handleChangePassword = async () => {
        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            showToast('Preencha todos os campos', 'error');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (error) throw error;

            showToast('Senha alterada com sucesso!', 'success');
            setIsChangingPassword(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showToast('Erro ao alterar senha: ' + error.message, 'error');
        }
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
                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <Bell className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">ℹ️ Verificação Automática Ativa</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    O sistema verifica automaticamente remédios atrasados <strong>a cada 2 horas</strong>.
                                    Você receberá um email se algum medicamento não for marcado como tomado após 30 minutos do horário agendado.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Bell className="text-slate-400 mt-1" size={20} />
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Verificação Manual</h4>
                                <p className="text-sm text-slate-500 mb-3">
                                    Não quer esperar? Clique abaixo para executar a verificação imediatamente.
                                </p>
                                <Button
                                    onClick={() => runCaregiverCheck()}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
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
                            onClick={() => {
                                setEditForm({
                                    name: user?.user_metadata?.full_name || '',
                                    email: user?.email || '',
                                    currentPassword: ''
                                });
                                setIsEditing(true);
                            }}
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

                <Card>
                    <CardContent className="p-0">
                        <button
                            onClick={() => setIsChangingPassword(true)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-400">
                                <Shield size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Alterar Senha</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Trocar sua senha de acesso</p>
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

                    <Input
                        label="Email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="seu@email.com"
                    />


                    {(editForm.email?.trim().toLowerCase() !== user?.email?.trim().toLowerCase()) && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <p className="text-sm text-amber-900 dark:text-amber-100 mb-3 font-medium">
                                🔒 Para alterar o email, confirme sua senha:
                            </p>
                            <Input
                                label="Senha Atual"
                                type="password"
                                value={editForm.currentPassword}
                                onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                                placeholder="Digite sua senha"
                            />
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                                ℹ️ Um email de confirmação será enviado para <strong>{editForm.email}</strong>
                            </p>
                        </div>
                    )}

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

            {/* Change Password Modal */}
            <Modal
                isOpen={isChangingPassword}
                onClose={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                title="Alterar Senha"
            >
                <div className="flex flex-col gap-4">
                    <Input
                        label="Nova Senha"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                    />

                    <Input
                        label="Confirmar Nova Senha"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Digite novamente"
                    />

                    <div className="flex gap-3 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsChangingPassword(false);
                                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleChangePassword} className="flex-1">
                            Alterar Senha
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Profile;
