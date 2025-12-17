import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { User, Settings, LogOut, Bell, LogIn, Database, Trash2, Mail, Phone, MapPin, Camera, Shield, Share2, Activity, Download, Users } from 'lucide-react';
import { downloadJSON, prepareBackupData } from '../utils/dataExporter';

const Profile = () => {
    const { user } = useAuth(); // AuthContext for user
    const {
        patients, medications, prescriptions, consumptionLog, healthLogs, // Data for backup
        showToast, runCaregiverCheck, logout,
        accountShares, shareAccount, unshareAccount, // Account Sharing
        accessibility, updateAccessibility
    } = useApp(); // AppContext for app features
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Loading state for save operations
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false); // Confirmation modal for email change
    const [pendingEmailChange, setPendingEmailChange] = useState(null); // Store pending email change data
    const [showShareModal, setShowShareModal] = useState(false); // Account Sharing Modal
    const [shareEmail, setShareEmail] = useState(''); // Email to share with
    const [editForm, setEditForm] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        cep: user?.user_metadata?.cep || '',
        city: user?.user_metadata?.city || '',
        state: user?.user_metadata?.state || '',
        ibge_code: user?.user_metadata?.ibge_code || '',
        currentPassword: '' // Para validar alteração de email
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Helper para formatar telefone
    const formatPhone = (value) => {
        if (!value) return '';
        const numbers = value.replace(/\D/g, '');
        if (numbers.length > 11) return numbers.slice(0, 11); // Limit

        let formatted = numbers;
        if (numbers.length > 0) {
            formatted = '(' + numbers.substring(0, 2);
        }
        if (numbers.length > 2) {
            formatted += ') ' + numbers.substring(2, 7);
        }
        if (numbers.length > 7) {
            formatted = '(' + numbers.substring(0, 2) + ') ' + numbers.substring(2, 7) + '-' + numbers.substring(7);
        }
        return formatted;
    };

    // Validar dados do DB sempre ao carregar para garantir persistência real
    React.useEffect(() => {
        if (!user?.id) return;

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data || user) {
                    setEditForm(prev => ({
                        ...prev,
                        email: user.email || '',
                        cep: data?.cep || user.user_metadata?.cep || '',
                        city: data?.city || user.user_metadata?.city || '',
                        state: data?.state || user.user_metadata?.state || '',
                        ibge_code: data?.ibge_code || user.user_metadata?.ibge_code || '',
                        phone: formatPhone(data?.phone || user.user_metadata?.phone || ''),
                        name: data?.full_name || user.user_metadata?.full_name || ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        };

        fetchProfile();
    }, [user?.id]); // Only re-run if ID changes, not reference

    const handleUpdateProfile = async () => {
        if (isSaving) return; // Prevent multiple clicks

        try {
            if (!editForm.name.trim()) {
                showToast('Nome é obrigatório', 'error');
                return;
            }

            // Se o email mudou, mostra confirmação primeiro
            const emailChanged = editForm.email !== user?.email;

            if (emailChanged) {
                if (!editForm.currentPassword) {
                    showToast('Digite sua senha para alterar o email', 'error');
                    return;
                }
                setPendingEmailChange({
                    newEmail: editForm.email,
                    password: editForm.currentPassword,
                    name: editForm.name,
                    phone: editForm.phone // Keep phone in pending state
                });
                setShowEmailConfirmModal(true);
                return; // Para aqui e espera confirmação
            }

            // Se não mudou email, atualiza nome e telefone (metadata)
            setIsSaving(true);
            try {
                // Limpar formatação antes de salvar
                const rawPhone = editForm.phone.replace(/\D/g, '');

                const { error } = await supabase.auth.updateUser({
                    data: {
                        full_name: editForm.name,
                        phone: rawPhone,
                        cep: editForm.cep,
                        city: editForm.city,
                        state: editForm.state,
                        ibge_code: editForm.ibge_code
                    }
                });

                // Also update public.profiles directly to ensure business logic consistency
                const updateData = {
                    cep: editForm.cep,
                    city: editForm.city,
                    state: editForm.state,
                    ibge_code: editForm.ibge_code,
                    full_name: editForm.name
                };

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', user.id)
                    .select(); // Add SELECT to see returned data

                if (profileError) console.error('Error updating profiles table:', profileError);

                if (error) {
                    showToast('Erro ao atualizar perfil: ' + error.message, 'error');
                    return;
                }
            } catch (error) {
                console.error('Exception in update:', error);
                showToast('Erro: ' + error.message, 'error');
                return;
            }

            setIsEditing(false);
            setEditForm({ ...editForm, currentPassword: '' }); // Limpa senha
            showToast('Perfil atualizado com sucesso!', 'success');
        } finally {
            setIsSaving(false); // Re-enable button
        }
    };



    // Função que executa após confirmação no modal
    const handleConfirmEmailChange = async () => {
        if (!pendingEmailChange) return;

        setIsSaving(true);
        setShowEmailConfirmModal(false);

        try {
            // Valida a senha atual
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: pendingEmailChange.password
            });

            if (signInError) {
                console.error('Erro de autenticação:', signInError);
                showToast('❌ Senha incorreta! Verifique e tente novamente.', 'error');
                return;
            }

            // Senha correta, atualiza o email
            const { error: updateError } = await supabase.auth.updateUser({
                email: pendingEmailChange.newEmail
            });

            if (updateError) {
                // Traduzir mensagens de erro do Supabase
                let errorMessage = 'Erro ao alterar email';

                if (updateError.message.includes('has already been registered') ||
                    updateError.message.includes('already registered') ||
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
            showToast(`Verifique ${pendingEmailChange.newEmail} e clique no link para confirmar`, 'info');

            // Aguarda 2 segundos para mostrar mensagens
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Faz logout
            await logout();
            navigate('/login');
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
            setPendingEmailChange(null);
        }
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

    const handleShareAccount = async () => {
        if (!shareEmail) return;
        if (!shareEmail.includes('@')) {
            showToast('Digite um email válido', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await shareAccount(shareEmail);
            setShareEmail('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
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

            {/* Accessibility Settings Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <Activity className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">Super Sênior</h2>
                    </div>
                    <p className="text-blue-700/80 dark:text-blue-300/70 text-sm">
                        Modo de acessibilidade para facilitar a leitura e uso.
                    </p>
                </div>
                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        {/* High Contrast Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <Shield className="text-slate-400" size={20} />
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Alto Contraste</h4>
                                    <p className="text-sm text-slate-500">Cores fortes e bordas definidas.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={accessibility?.highContrast || false}
                                    onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Large Text Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <Settings className="text-slate-400" size={20} />
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Texto Grande</h4>
                                    <p className="text-sm text-slate-500">Aumenta o tamanho da letra em 25%.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={accessibility?.largeText || false}
                                    onChange={(e) => updateAccessibility({ largeText: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Voice Enabled Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <Bell className="text-slate-400" size={20} />
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Assistente de Voz</h4>
                                    <p className="text-sm text-slate-500">Ouvir comandos e alertas por voz.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={accessibility?.voiceEnabled || false}
                                    onChange={(e) => updateAccessibility({ voiceEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
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
                                // Don't overwrite state with basic user metadata! 
                                // State is already populated by useEffect with DB data.
                                // Just clear sensitive fields.
                                setEditForm(prev => ({
                                    ...prev,
                                    currentPassword: ''
                                }));
                                setIsEditing(true);
                            }}
                            className="w-full flex items-center gap-4 p-4 border-b border-[#e2e8f0] dark:border-slate-800 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-400">
                                <User size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Dados Pessoais</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Visualize e edite suas informações de perfil, como nome e email.</p>
                            </div>
                        </button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <button
                            onClick={() => setIsChangingPassword(true)}
                            className="w-full flex items-center gap-4 p-4 border-b border-[#e2e8f0] dark:border-slate-800 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-400">
                                <Shield size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Alterar Senha</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Atualize sua senha para garantir a segurança da sua conta.</p>
                            </div>
                        </button>
                    </CardContent>
                </Card>



                {/* Account Sharing */}
                <Card>
                    <CardContent className="p-0">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="w-full flex items-center gap-4 p-4 border-b border-[#e2e8f0] dark:border-slate-800 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-400">
                                <Users size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Compartilhar Conta</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Dê acesso aos seus dados para familiares ou cuidadores.</p>
                            </div>
                        </button>
                    </CardContent>
                </Card>

                {/* Data Export / Backup */}
                <Card>
                    <CardContent className="p-0">
                        <button
                            onClick={() => {
                                const backupData = prepareBackupData({
                                    patients, medications, prescriptions, consumptionLog, healthLogs
                                }, user);
                                downloadJSON(backupData);
                                showToast('Backup gerado com sucesso!', 'success');
                            }}
                            className="w-full flex items-center gap-4 p-4 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50 text-left transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Download size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-[#0f172a] dark:text-white">Baixar MEUS Dados</h3>
                                <p className="text-sm text-[#64748b] dark:text-slate-400">Exporte uma cópia completa do seu histórico (Backup) para seu dispositivo.</p>
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

                    <Input
                        label="Telefone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                    />

                    <Input
                        label="CEP"
                        value={editForm.cep}
                        onChange={async (e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 8) value = value.slice(0, 8);
                            const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');

                            setEditForm(prev => ({ ...prev, cep: formatted }));

                            if (value.length === 8) {
                                try {
                                    const { fetchAddressByCEP } = await import('../services/cepService');
                                    const address = await fetchAddressByCEP(value);
                                    setEditForm(prev => ({
                                        ...prev,
                                        cep: formatted,
                                        city: address.city,
                                        state: address.state,
                                        ibge_code: address.ibge
                                    }));
                                } catch (err) {
                                    showToast('CEP não encontrado', 'error');
                                }
                            }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                    />

                    <Input
                        label="Cidade"
                        value={editForm.city ? `${editForm.city} - ${editForm.state}` : ''}
                        disabled
                        className="bg-slate-50"
                        placeholder="..."
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
                        <Button onClick={handleUpdateProfile} className="flex-1" disabled={isSaving}>
                            {isSaving ? '⏳ Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Email Change Confirmation Modal */}
            <Modal
                isOpen={showEmailConfirmModal}
                onClose={() => {
                    setShowEmailConfirmModal(false);
                    setPendingEmailChange(null);
                }}
                title="⚠️ Confirmar Mudança de Email"
            >
                <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
                            <strong>📧 Você está prestes a alterar seu email para:</strong>
                        </p>
                        <p className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-3">
                            {pendingEmailChange?.newEmail}
                        </p>
                        <hr className="border-amber-200 dark:border-amber-700 my-3" />
                        <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
                            <strong>✉️ O que vai acontecer:</strong>
                        </p>
                        <ul className="text-sm text-amber-900 dark:text-amber-100 space-y-1 list-disc list-inside">
                            <li>Você receberá um <strong>email de confirmação</strong> no novo endereço</li>
                            <li>Clique no link do email para <strong>confirmar a mudança</strong></li>
                            <li>Você será <strong>deslogado automaticamente</strong> após enviar</li>
                            <li>Faça login com o <strong>novo email</strong> após confirmar</li>
                        </ul>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Tem certeza que deseja continuar?
                    </p>

                    <div className="flex gap-3 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowEmailConfirmModal(false);
                                setPendingEmailChange(null);
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmEmailChange}
                            className="flex-1 bg-amber-500 hover:bg-amber-600"
                            disabled={isSaving}
                        >
                            {isSaving ? '⏳ Processando...' : '✅ Sim, Confirmar'}
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
                        <Button variant="ghost" onClick={() => setIsChangingPassword(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleChangePassword} className="flex-1">
                            Alterar Senha
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Share Account Modal */}
            <Modal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="Compartilhar Conta"
            >
                <div className="flex flex-col gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Compartilhe o acesso total da sua conta (pacientes, remédios e receitas) com familiares ou cuidadores.
                            Eles poderão visualizar e gerenciar seus dados.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Convidar nova pessoa</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Email da pessoa"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleShareAccount}
                                disabled={isSaving || !shareEmail}
                                className="whitespace-nowrap"
                            >
                                {isSaving ? 'Enviando...' : 'Convidar'}
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <Users size={16} /> Acessos Compartilhados
                        </h4>

                        {accountShares && accountShares.length > 0 ? (
                            <div className="space-y-3">
                                {accountShares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{share.shared_with_email}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja remover o acesso desta pessoa?')) {
                                                    unshareAccount(share.id);
                                                }
                                            }}
                                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                        >
                                            Revogar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">
                                Você ainda não compartilhou sua conta com ninguém.
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default Profile;
