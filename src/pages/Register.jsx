import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus } from 'lucide-react';
import { fetchAddressByCEP } from '../services/cepService';

const Register = () => {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle, user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        cep: '',
        city: '',
        state: '',
        ibge_code: ''
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCepChange = async (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        // Mask: 00000-000
        const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');

        setFormData(prev => ({
            ...prev,
            cep: formatted,
        }));

        if (value.length === 8) {
            try {
                const address = await fetchAddressByCEP(value);
                setFormData(prev => ({
                    ...prev,
                    cep: formatted,
                    city: address.city,
                    state: address.state,
                    ibge_code: address.ibge
                }));
                setError('');
            } catch (err) {
                setError(err.message || 'CEP não encontrado. Preencha cidade/estado manualmente.');
                // Allow manual entry - don't clear the city/state fields if already set
            }
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        const { error: googleError } = await signInWithGoogle();
        if (googleError) {
            setError(googleError.message || 'Erro ao cadastrar com Google');
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.trim() !== formData.confirmPassword.trim()) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        // Validation: require city OR allow error with manual fill
        if (!formData.city && !error) {
            if (formData.cep.length === 9) {
                setError('Aguarde a busca do CEP completar ou preencha a cidade manualmente.');
                return;
            }
        }

        setLoading(true);

        const { error: signUpError } = await signUp(
            formData.email.trim(),
            formData.password.trim(),
            formData.fullName.trim(),
            {
                cep: formData.cep,
                city: formData.city,
                state: formData.state,
                ibge_code: formData.ibge_code
            }
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

                {/* Google Signup Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all shadow-sm mb-4"
                >
                    {googleLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    <span>{googleLoading ? 'Cadastrando...' : 'Cadastrar com Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-500">ou cadastre com email</span></div>
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
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        placeholder="João Silva"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <Input
                                label="CEP"
                                type="text"
                                id="cep"
                                name="cep"
                                autoComplete="postal-code"
                                placeholder="00000-000"
                                value={formData.cep || ''}
                                onChange={handleCepChange}
                                maxLength={9}
                                required
                            />
                        </div>
                        <div className="w-2/3">
                            <Input
                                label="Cidade/Estado"
                                type="text"
                                id="cityState"
                                name="cityState"
                                autoComplete="off"
                                placeholder={error ? "Ex: São Paulo/SP" : "Preenchido automaticamente"}
                                value={formData.city ? `${formData.city}/${formData.state}` : ''}
                                onChange={e => {
                                    const [c, s] = e.target.value.split('/').map(x => x.trim());
                                    setFormData(prev => ({ ...prev, city: c || '', state: s || '' }));
                                }}
                                disabled={!!formData.city && !error}
                                className={formData.city && !error ? 'bg-slate-50' : ''}
                            />
                        </div>
                    </div>

                    <Input
                        label="Senha"
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <Input
                        label="Confirmar Senha"
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
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
