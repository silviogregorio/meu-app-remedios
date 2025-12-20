import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Share2, Plus, Trash2, ShieldCheck, Users } from 'lucide-react';

const Share = () => {
    const { accountShares, shareAccount, unshareAccount, showToast } = useApp();
    const [shareEmail, setShareEmail] = useState('');
    const [deleteShareId, setDeleteShareId] = useState(null);

    const handleShare = async (e) => {
        e.preventDefault();
        if (!shareEmail.trim()) {
            showToast('Digite um email válido', 'error');
            return;
        }
        await shareAccount(shareEmail);
        setShareEmail('');
    };

    const confirmDeleteShare = async () => {
        if (deleteShareId) {
            await unshareAccount(deleteShareId);
            setDeleteShareId(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-8 h-8 text-primary" />
                    Compartilhamento de Conta (Geral)
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Gerencie quem pode acessar TODOS os seus dados (Pacientes, Medicamentos, etc.)
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex flex-col gap-1">
                    <p className="font-bold">⚠️ Atenção:</p>
                    <p>
                        Adicionar alguém aqui dá acesso a <strong>Sua Conta Inteira</strong>.
                        Se você quer compartilhar apenas <strong>UM Paciente</strong> específico, vá na tela de <a href="/patients" className="underline font-bold">Pacientes</a> e clique no botão "Compartilhar" dentro do cartão do paciente.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        Adicionar Novo Membro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-6">
                        <p>
                            Ao adicionar um email aqui, essa pessoa terá <strong>acesso total</strong> para visualizar, adicionar, editar e excluir seus pacientes, medicamentos e receitas.
                        </p>
                    </div>

                    <form onSubmit={handleShare} className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Email do novo membro..."
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            containerClassName="flex-1"
                            type="email"
                        />
                        <Button type="submit" disabled={!shareEmail} className="w-full sm:w-auto">
                            <Plus size={20} className="mr-2" />
                            Convidar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Pessoas com Acesso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {accountShares.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Share2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Você ainda não compartilhou sua conta com ninguém.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accountShares.map(share => (
                                <div key={share.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {share.shared_with_email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{share.shared_with_email}</p>
                                            <p className="text-xs text-slate-500">Acesso completo</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteShareId(share.id)}
                                        className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                                        title="Remover acesso"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={!!deleteShareId}
                onClose={() => setDeleteShareId(null)}
                title="Remover Acesso"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteShareId(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmDeleteShare}>Confirmar Remoção</Button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <p className="text-slate-600 text-lg">
                        Tem certeza que deseja remover o acesso deste usuário?
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Ele deixará de visualizar e gerenciar seus dados imediatamente.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default Share;
