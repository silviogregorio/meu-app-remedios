import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MapPin, LogOut } from 'lucide-react';
import { fetchAddressByCEP } from '../services/cepService';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { showToast } = useApp();
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [ibgeCode, setIbgeCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [error, setError] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyEmail, setEmergencyEmail] = useState('');

    const handleCepChange = async (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        // Mask: 00000-000
        const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');
        setCep(formatted);

        // Clear previous data when CEP changes
        if (value.length < 8) {
            setStreet('');
            setNeighborhood('');
            setCity('');
            setState('');
            setIbgeCode('');
        }

        if (value.length === 8) {
            setCepLoading(true);
            try {
                const address = await fetchAddressByCEP(value);
                setStreet(address.street || '');
                setNeighborhood(address.neighborhood || '');
                setCity(address.city);
                setState(address.state);
                setIbgeCode(address.ibge);
                setError('');
            } catch (err) {
                console.error('CEP lookup error:', err);
                setError(err.message || 'CEP não encontrado. Você pode preencher os dados manualmente.');
                // Don't clear fields if they were already partially filled, 
                // but allow them to be visible by setting a flag or just city=''
                setCity('');
                setIbgeCode('');
            } finally {
                setCepLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!city || !state) {
            setError('Por favor, informe pelo menos a cidade e o estado.');
            return;
        }

        setLoading(true);

        try {
            // Update user metadata in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    cep,
                    street,
                    number,
                    neighborhood,
                    city,
                    state,
                    ibge_code: ibgeCode
                }
            });

            if (updateError) throw updateError;

            // Also update the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    cep,
                    street,
                    number,
                    neighborhood,
                    city,
                    state,
                    ibge_code: ibgeCode
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Profile update error:', profileError);
            }

            // Sync Emergency Contact to Profile too if not already there
            await supabase
                .from('profiles')
                .update({
                    emergency_contact_name: emergencyName,
                    emergency_contact_phone: emergencyPhone,
                    emergency_contact_email: emergencyEmail
                })
                .eq('id', user.id);

            // 3. AUTO-CREATE PATIENT (Mágica ✨)
            // Check if patient already exists for this user to avoid duplicates
            const { data: existingPatients } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_self', true);

            if (!existingPatients || existingPatients.length === 0) {
                const { error: patientError } = await supabase
                    .from('patients')
                    .insert([{
                        user_id: user.id,
                        name: user.user_metadata?.full_name || 'Eu mesmo',
                        email: user.email,
                        cep: cep,
                        street: street,
                        number: number,
                        neighborhood: neighborhood,
                        city: city,
                        state: state,
                        is_self: true,
                        emergency_contact_name: emergencyName,
                        emergency_contact_phone: emergencyPhone,
                        emergency_contact_email: emergencyEmail
                    }]);

                if (patientError) {
                    console.error('Auto-patient creation error:', patientError);
                }
            }

            showToast('Perfil atualizado com sucesso!', 'success');

            // Force page reload to update user metadata
            window.location.href = '/app';
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                        <MapPin size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete seu Perfil</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center mt-2">
                        Para usar o SiG Remédios, precisamos saber sua localização
                    </p>
                </div>

                {/* User Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 flex items-center gap-4">
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                            {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {user?.user_metadata?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* CEP */}
                    <Input
                        label="CEP"
                        type="text"
                        id="cep"
                        name="cep"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        maxLength={9}
                        required
                        autoFocus
                    />

                    {/* Loading indicator */}
                    {cepLoading && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Buscando endereço...</span>
                        </div>
                    )}

                    {/* Address fields - shown after CEP is found or if user needs to fill manually on error */}
                    {(city || error.includes('manualmente')) && (
                        <>
                            {/* Rua + Número */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <Input
                                        label="Rua / Logradouro"
                                        type="text"
                                        id="street"
                                        name="street"
                                        placeholder="Rua das Flores"
                                        value={street}
                                        onChange={e => setStreet(e.target.value)}
                                        className={street && !error ? 'bg-slate-50 dark:bg-slate-800' : ''}
                                    />
                                </div>
                                <div className="w-24">
                                    <Input
                                        label="Número"
                                        type="text"
                                        id="number"
                                        name="number"
                                        placeholder="123"
                                        value={number}
                                        onChange={e => setNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Bairro */}
                            <Input
                                label="Bairro"
                                type="text"
                                id="neighborhood"
                                name="neighborhood"
                                placeholder="Centro"
                                value={neighborhood}
                                onChange={e => setNeighborhood(e.target.value)}
                                className={neighborhood && !error ? 'bg-slate-50 dark:bg-slate-800' : ''}
                            />

                            {/* Cidade / Estado */}
                            <Input
                                label="Cidade / Estado"
                                type="text"
                                id="city"
                                name="city"
                                value={city ? `${city} - ${state}` : ''}
                                onChange={e => {
                                    if (!city || error.includes('manualmente')) {
                                        const [c, s] = e.target.value.split('-').map(x => x.trim());
                                        setCity(c || '');
                                        setState(s || '');
                                    }
                                }}
                                placeholder="Ex: São Paulo - SP"
                                disabled={!!city && !error}
                                className={city && !error ? 'bg-slate-50 dark:bg-slate-800' : ''}
                                required
                            />
                        </>
                    )}

                    {/* Emergency Contact Section */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            🚨 Contato de Emergência (SOS)
                        </h3>
                        <div className="flex flex-col gap-3">
                            <Input
                                label="Nome do Responsável"
                                type="text"
                                id="emName"
                                name="emName"
                                placeholder="Cônjuge, Filho, Vizinho..."
                                value={emergencyName}
                                onChange={e => setEmergencyName(e.target.value)}
                                required
                            />
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <Input
                                        label="Telefone"
                                        type="tel"
                                        id="emPhone"
                                        name="emPhone"
                                        placeholder="(00) 00000-0000"
                                        value={emergencyPhone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            let formatted = val;
                                            if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                                            if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`;
                                            setEmergencyPhone(formatted);
                                        }}
                                        maxLength={15}
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        label="Email"
                                        type="email"
                                        id="emEmail"
                                        name="emEmail"
                                        placeholder="email@exemplo.com"
                                        value={emergencyEmail}
                                        onChange={e => setEmergencyEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                * Este contato receberá um email com sua localização caso você use o botão de pânico.
                            </p>
                        </div>
                    </div>

                    <Button type="submit" fullWidth disabled={loading || (!city && !error.includes('manualmente'))} className="mt-2">
                        {loading ? 'Salvando...' : 'Continuar para o App'}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Sair e usar outra conta</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
