import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { HeartPulse, Fingerprint } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { signIn, user } = useAuth();
    const { showToast } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasBiometrics, setHasBiometrics] = useState(false);

    useEffect(() => {
        const enabled = localStorage.getItem('sig_biometric_enabled') === 'true';
        setHasBiometrics(enabled);
    }, []);

    const handleBiometricLogin = async () => {
        setLoading(true);
        // Simular verificação WebAuthn
        setTimeout(() => {
            if (window.confirm('Verificar Biometria?')) {
                // Em um cenário real, aqui usaríamos o token salvo para autenticar
                // Para este MVP, vamos alertar que a funcionalidade precisa de integração backend completa
                // Mas vamos simular o sucesso se houver um email salvo
                const savedEmail = localStorage.getItem('sig_last_email');
                if (savedEmail) {
                    setEmail(savedEmail);
                    showToast('Biometria verificada!', 'success');
                } else {
                    setError('Por favor, entre com senha a primeira vez para vincular sua biometria.');
                }
            }
            setLoading(false);
        }, 1000);
    };

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
            localStorage.setItem('sig_last_email', email);
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
                        id="email"
                        name="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Senha"
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" fullWidth disabled={loading} className="mt-2">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    {hasBiometrics && (
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-500 italic">Ou use o modo mais fácil</span></div>
                        </div>
                    )}

                    {hasBiometrics && (
                        <button
                            type="button"
                            onClick={handleBiometricLogin}
                            disabled={loading}
                            className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
                        >
                            <Fingerprint size={48} className="text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-700 dark:text-blue-400 font-black text-xl">Entrar com Digital / Rosto</span>
                        </button>
                    )}
                </form>

                <div className="mt-6 text-center text-sm text-[#64748b]">
                    <p>Não tem conta? <Link to="/register" className="text-[#10b981] font-bold hover:underline">Cadastre-se</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
