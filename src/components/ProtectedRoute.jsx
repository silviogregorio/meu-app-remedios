import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false, skipProfileCheck = false }) => {
    const { user, loading, mfaRequired, mfaChallenge, verifyMFA, clearMfaState } = useAuth();
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        if (mfaCode.length !== 6) return;

        setMfaLoading(true);
        setMfaError('');

        const { error } = await verifyMFA(
            mfaChallenge.factorId,
            mfaChallenge.challengeId,
            mfaCode
        );

        if (error) {
            setMfaError('Código inválido. Tente novamente.');
            setMfaLoading(false);
        } else {
            clearMfaState();
            setMfaLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // MFA Verification Gate
    if (mfaRequired && mfaChallenge) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                            <Shield size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificação de Segurança</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mt-2">Digite o código de 6 dígitos do seu app autenticador.</p>
                    </div>

                    <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
                        {mfaError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-semibold">
                                {mfaError}
                            </div>
                        )}

                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center text-4xl tracking-[0.5em] font-mono py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all"
                            autoFocus
                            required
                        />

                        <button
                            type="submit"
                            disabled={mfaLoading || mfaCode.length !== 6}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {mfaLoading ? 'Verificando...' : 'Confirmar Código'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Check if profile is complete (has CEP/IBGE)
    // Skip this check for the complete-profile page itself
    if (!skipProfileCheck) {
        const hasCompleteProfile =
            user.user_metadata?.ibge_code ||
            user.user_metadata?.cep;

        if (!hasCompleteProfile) {
            return <Navigate to="/complete-profile" replace />;
        }
    }

    // Admin-only route protection
    const adminEmails = ['sigremedios@gmail.com', 'sigsis@gmail.com', 'silviogregorio@gmail.com'];
    if (adminOnly && !adminEmails.includes(user.email)) {
        return <Navigate to="/app" replace />;
    }

    return children;
};

export default ProtectedRoute;
