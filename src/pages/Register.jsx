import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const { signUp, user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/app');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const { error: signUpError } = await signUp(
            formData.email,
            formData.password,
            formData.fullName
        );

        if (signUpError) {
            setError(signUpError.message || 'Erro ao criar conta');
            setLoading(false);
        } else {
            navigate('/app');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg transform rotate-3">
                        <UserPlus size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Criar Conta</h1>
                    <p className="text-[#64748b] dark:text-slate-400">Preencha os dados para começar</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nome Completo"
                        type="text"
                        placeholder="João Silva"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <Input
                        label="Confirmar Senha"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                    />

                    <Button type="submit" fullWidth disabled={loading} className="mt-2">
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-[#64748b]">
                    <p>Já tem conta? <Link to="/login" className="text-[#10b981] font-bold hover:underline">Entrar</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
