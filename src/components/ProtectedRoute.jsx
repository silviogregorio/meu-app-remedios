import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Shield, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingScreen from './ui/LoadingScreen';

const MFA_LOCKOUT_KEY = 'mfa_lockout_until';
const MFA_ATTEMPTS_KEY = 'mfa_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000; // 60 seconds

const ProtectedRoute = ({ children, adminOnly = false, skipProfileCheck = false }) => {
    const { user, loading: authLoading, mfaRequired, mfaChallenge, currentAal, verifyMFA, challengeMFA, verifyPasskey, clearMfaState, refreshMfaChallenge, hasManualPasskey } = useAuth();
    const { showToast } = useApp(); // Get showToast from useApp

    const [retryLoading, setRetryLoading] = useState(false);

    // Biometric Handler
    // Biometric Handler (Manual or Native)
    const handleBiometricVerify = async (providedFactorId = null) => {
        try {
            setMfaLoading(true);
            setMfaError('');

            // Priority: Manual Passkey flow
            if (hasManualPasskey) {
                const { error: verifyError } = await verifyPasskey();
                if (verifyError) throw verifyError;
            } else if (providedFactorId) {
                // Legacy / Native Fallback - Note: verifyPasskey in Context now only handles manual
                // If we really need native verification, we'd need a separate function.
                // But since it's disabled in dashboard, we focus on manual.
                throw new Error('Biometria nativa desativada. Por favor, re-cadastre sua biometria.');
            } else {
                throw new Error('Nenhuma credencial biométrica encontrada.');
            }

            // Success is handled by verifyPasskey updating context state
        } catch (err) {
            console.error('🔐 Biometric Verify Error:', err);
            setMfaError(err.message || 'Erro na biometria. Tente novamente ou use o código.');
            setMfaLoading(false);
        }
    };


    // NEW: Robust Loading State
    // We must wait if Auth is loading OR if we are still checking MFA requirement (mfaRequired === null)
    // If MFA is not required (false), we don't need to wait for currentAal
    const isActuallyReady = !authLoading && mfaRequired !== null && (mfaRequired === false || currentAal !== null);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);

    // Persist lockout and attempts in localStorage to survive page reload
    const [lockoutUntil, setLockoutUntil] = useState(() => {
        const saved = localStorage.getItem(MFA_LOCKOUT_KEY);
        const savedTime = saved ? parseInt(saved, 10) : null;

        if (savedTime) {
            if (savedTime > Date.now()) {
                console.log('🔐 ProtectedRoute: Lockout ativo até', new Date(savedTime).toLocaleTimeString());
                return savedTime;
            } else {
                // Lockout expired, clear stored data now
                console.log('🔐 ProtectedRoute: Lockout expirado durante refresh, limpando...');
                localStorage.removeItem(MFA_LOCKOUT_KEY);
                localStorage.removeItem(MFA_ATTEMPTS_KEY);
            }
        }
        return null;
    });

    const [lockoutSeconds, setLockoutSeconds] = useState(() => {
        const saved = localStorage.getItem(MFA_LOCKOUT_KEY);
        const savedTime = saved ? parseInt(saved, 10) : null;
        return savedTime && savedTime > Date.now() ? Math.ceil((savedTime - Date.now()) / 1000) : 0;
    });

    // Persist failed attempts count - survives F5 refresh
    const [failedAttempts, setFailedAttempts] = useState(() => {
        const saved = localStorage.getItem(MFA_ATTEMPTS_KEY);
        const count = saved ? parseInt(saved, 10) : 0;
        if (count > 0) console.log('🔐 ProtectedRoute: Carregando', count, 'tentativas falhas do localStorage');
        return count;
    });

    const inputRef = useRef(null);

    // Show lockout message on initial load if lockout is active
    // Consolidated Lockout Management: handles countdown, expiry, and challenge refresh
    useEffect(() => {
        if (!lockoutUntil) {
            // If we're not technically locked out but still have the placeholder challenge,
            // we should refresh to get a real one.
            if (mfaRequired && mfaChallenge?.challengeId === 'lockout-active') {
                console.log('🔐 No lockout timer but placeholder challenge found. Refreshing...');
                refreshMfaChallenge(true);
            }
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil((lockoutUntil - now) / 1000);

            if (remaining <= 0) {
                console.log('🔐 Lockout expired! Resetting state and refreshing challenge...');
                clearInterval(interval);

                // 1. Reset local state
                setLockoutUntil(null);
                setLockoutSeconds(0);
                setMfaError('');
                setFailedAttempts(0);

                // 2. Clear persistence
                localStorage.removeItem(MFA_ATTEMPTS_KEY);
                localStorage.removeItem(MFA_LOCKOUT_KEY);

                // 3. Trigger a REAL MFA challenge refresh
                if (mfaRequired) {
                    refreshMfaChallenge(true); // force=true bypasses the "already has challenge" check
                }
            } else {
                setLockoutSeconds(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutUntil, mfaRequired, mfaChallenge, refreshMfaChallenge]);


    // Log failed MFA attempt to audit_logs and return new attempt count
    const logFailedMfaAttempt = async (currentAttempts) => {
        const newAttempts = currentAttempts + 1;

        // Determine risk level based on failed attempts
        let risk_level = 'low';
        if (newAttempts >= MAX_ATTEMPTS) risk_level = 'critical';
        else if (newAttempts >= 3) risk_level = 'high';
        else if (newAttempts >= 2) risk_level = 'medium';

        try {
            const { error } = await supabase.from('audit_logs').insert({
                user_id: user?.id,
                user_email: user?.email,
                action: 'mfa_verification_failed',
                resource_type: 'auth',
                metadata: {
                    attempt_number: newAttempts,
                    factor_id: mfaChallenge?.factorId
                },
                is_suspicious: newAttempts >= 2,
                risk_level,
                ip_address: null
            });
            if (error) {
                console.error('🔐 [AUDIT] Insert error:', error);
            } else {
                console.log(`🔐 [AUDIT] MFA failed attempt #${newAttempts} logged as ${risk_level}`);
            }
        } catch (err) {
            console.error('Failed to log MFA attempt:', err);
        }

        return newAttempts;
    };



    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        if (mfaCode.length !== 6) return;

        // Check if user is locked out
        if (lockoutUntil && Date.now() < lockoutUntil) {
            setMfaError('Bloqueio ativo. Aguarde o contador zerar.');
            return;
        }

        // If we have a placeholder challenge, don't even try to verify
        if (mfaChallenge?.challengeId === 'lockout-active') {
            setMfaError('Você ainda está bloqueado. Aguarde.');
            return;
        }

        setMfaLoading(true);
        setMfaError('');

        const { error } = await verifyMFA(
            mfaChallenge.factorId,
            mfaChallenge.challengeId,
            mfaCode
        );

        if (error) {
            setMfaCode(''); // Clear the input

            // Log the failed attempt and get new count
            const newAttempts = await logFailedMfaAttempt(failedAttempts);
            setFailedAttempts(newAttempts);
            localStorage.setItem(MFA_ATTEMPTS_KEY, newAttempts.toString());

            // Check if we need to lock out
            if (newAttempts >= MAX_ATTEMPTS) {
                const lockTime = Date.now() + LOCKOUT_DURATION_MS;
                setLockoutUntil(lockTime);
                setLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
                // Persist lockout in localStorage
                localStorage.setItem(MFA_LOCKOUT_KEY, lockTime.toString());
                setMfaError('Muitas tentativas. Aguarde 60 segundos.');
            } else {
                setMfaError(`Código inválido. Tentativa ${newAttempts}/${MAX_ATTEMPTS}.`);
                // Focus the input after clearing
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            setMfaLoading(false);
        } else {
            // Clear all lockout data on success
            localStorage.removeItem(MFA_LOCKOUT_KEY);
            localStorage.removeItem(MFA_ATTEMPTS_KEY);
            setFailedAttempts(0);
            clearMfaState();
            setMfaLoading(false);
        }
    };

    if (!isActuallyReady) {
        return <LoadingScreen text="Verificando segurança..." />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // MFA Verification Gate - BLOCKS ALL CONTENT including header
    // Use currentAal from AuthContext for centralized source of truth
    if (mfaRequired && currentAal !== 'aal2') {
        // console.log('🛡️ ProtectedRoute: Gate triggered. mfaRequired:', mfaRequired, 'currentAal:', currentAal);
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-12 sm:pt-20 md:justify-center md:pt-0 bg-slate-100 dark:bg-slate-950 p-4 overflow-y-auto">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
                            <Shield size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificação de Segurança</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mt-2">Digite o código de 6 dígitos do seu app autenticador.</p>
                    </div>

                    {!mfaChallenge ? (
                        <div className="flex flex-col gap-4 text-center">
                            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm">
                                <p className="font-bold">Aguardando geração do desafio...</p>
                                <p className="mt-1">Isso pode acontecer devido a muitas tentativas seguidas.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    setRetryLoading(true);
                                    try {
                                        await refreshMfaChallenge(true);
                                        if (mfaRequired && !mfaChallenge) {
                                            showToast('A conexão com o servidor de segurança está lenta. Tente novamente em 2 segundos.', 'info');
                                        }
                                    } finally {
                                        setRetryLoading(false);
                                    }
                                }}
                                disabled={retryLoading}
                                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                {retryLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Solicitando...</span>
                                    </>
                                ) : (
                                    "Tentar Novamente"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
                                {mfaError && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-semibold animate-shake">
                                        {mfaError}
                                        {lockoutSeconds > 0 && (
                                            <div className="text-lg font-bold mt-2">
                                                ⏱️ {lockoutSeconds}s
                                            </div>
                                        )}
                                    </div>
                                )}

                                <input
                                    ref={inputRef}
                                    type="text"
                                    maxLength="6"
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center text-3xl tracking-[0.3em] font-mono py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    autoFocus
                                    required
                                    id="mfa-code-input"
                                    disabled={lockoutSeconds > 0}
                                />

                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={mfaLoading || mfaCode.length !== 6 || lockoutSeconds > 0}
                                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {lockoutSeconds > 0 ? `Aguarde ${lockoutSeconds}s` : (mfaLoading ? 'Verificando...' : 'Confirmar Código')}
                                    </button>

                                    {/* WebAuthn / Biometrics Button */}
                                    {(() => {
                                        const webAuthnFactor = user?.factors?.find(f => f.factor_type === 'webauthn' && f.status === 'verified');
                                        if (webAuthnFactor || hasManualPasskey) {
                                            return (
                                                <button
                                                    type="button"
                                                    disabled={lockoutSeconds > 0}
                                                    onClick={() => handleBiometricVerify(webAuthnFactor?.id)}
                                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                                >
                                                    <Fingerprint size={20} />
                                                    <span>Usar Biometria</span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </form>
                        </div>
                    )}
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
