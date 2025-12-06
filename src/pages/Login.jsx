import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { HeartPulse } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { signIn, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/app');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: signInError } = await signIn(email.trim(), password.trim());

        if (signInError) {
            setError(signInError.message || 'Email ou senha inválidos');
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
                        <HeartPulse size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Bem-vindo</h1>
                    <p className="text-[#64748b] dark:text-slate-400">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" fullWidth disabled={loading} className="mt-2">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-[#64748b]">
                    <p>Não tem conta? <Link to="/register" className="text-[#10b981] font-bold hover:underline">Cadastre-se</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
