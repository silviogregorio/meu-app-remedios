import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus } from 'lucide-react';
import { fetchAddressByCEP } from '../services/cepService';

const Register = () => {
    const navigate = useNavigate();
    const { signUp, user } = useAuth();
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
    const [error, setError] = useState('');

    // ... useEffect

    const handleCepChange = async (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        // Mask: 00000-000
        const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');

        setFormData(prev => ({
            ...prev,
            cep: formatted,
            // Reset location if CEP changes significantly? Maybe not to avoid flicker
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
                setError('CEP não encontrado. Digite manualmente ou verifique.');
                // Optional: Let them type city manually if API fails? 
                // For "Exclusivity" logic, we really need the IBGE. 
                // Let's enforce it for now or assume reliability.
            }
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

        if (!formData.ibge_code) {
            // Should we block? "Precisamos pegar o IBGE". 
            // If API fails, user is stuck.
            // Ideally, we allow signup but warn. Or we force it.
            // Given the business constraint ("Exclusivity per City"), we should try hard to get it.
            // If unavailable, maybe let it pass but flag it?
            // I'll block lightly:
            if (formData.cep.length === 9 && !formData.city) {
                setError('Aguarde a busca do CEP completar.');
                return;
            }
        }

        setLoading(true);

        const { error: signUpError } = await signUp(
            formData.email.trim(),
            formData.password.trim(),
            formData.fullName.trim(),
            // Pass extra metadata here effectively
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
                                placeholder="Preenchido automaticamente"
                                value={formData.city ? `${formData.city}/${formData.state}` : ''}
                                disabled
                                className="bg-slate-50"
                            />
                        </div >
                    </div >
                    {/* Hidden IBGE field debug: {formData.ibge_code} */}

                    < Input
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
                </form >

                <div className="mt-6 text-center text-sm text-[#64748b]">
                    <p>Já tem conta? <Link to="/login" className="text-[#10b981] font-bold hover:underline">Entrar</Link></p>
                </div>
            </div >
        </div >
    );
};

export default Register;
