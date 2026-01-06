import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasManualPasskey, setHasManualPasskey] = useState(false);

    // Verify session is still valid by checking with Supabase
    const verifySession = useCallback(async () => {
        try {
            const { data: { user: currentUser }, error } = await supabase.auth.getUser();

            if (error || !currentUser) {
                // User no longer exists or session is invalid
                console.warn('Session invalid or user deleted, signing out...');
                await supabase.auth.signOut();
                setUser(null);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Session verification error:', err);
            return false;
        }
    }, []);

    const [mfaRequired, setMfaRequired] = useState(null); // null = checking, true = required, false = not required
    const [mfaChallenge, setMfaChallenge] = useState(null); // { factorId, challengeId }
    const [currentAal, setCurrentAal] = useState(null); // Track current session AAL level - null = unknown

    // Check if user needs MFA verification (has factors but session is aal1)
    const checkMfaRequirement = useCallback(async (force = false) => {
        // console.log('🔐 MFA: Iniciando verificação (force:', force, ')');

        // Timeout Helper for Supabase Calls - Slightly increased for reliability
        const withTimeout = (promise, ms = 5000) => Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('MFA call timeout')), ms))
        ]);

        // Check for active lockout first - BYPASS NETWORK CALLS IF LOCKED OUT
        const lockoutUntil = localStorage.getItem('mfa_lockout_until');
        const isLockedOut = lockoutUntil && parseInt(lockoutUntil, 10) > Date.now();

        if (isLockedOut) {
            console.log('🔐 MFA: User is currently locked out. Using placeholder challenge to avoid network hangs.');
            setMfaRequired(true);
            setMfaChallenge({ factorId: 'lockout-pending', challengeId: 'lockout-active' });
            return true;
        }

        // Skip if already requiring MFA and we have a challenge - UNLESS FORCED
        if (!force && mfaRequired === true && mfaChallenge) {
            console.log('🔐 MFA already required, skipping check');
            return true;
        }

        try {
            // 1. Get AAL Level (Fastest call)
            const { data: aalData, error: aalError } = await withTimeout(supabase.auth.mfa.getAuthenticatorAssuranceLevel());
            if (aalError) {
                console.warn('🔐 Error getting AAL:', aalError);
                // Fail-safe: if we can't get AAL but previously thought MFA was needed, keep it
                return mfaRequired === true;
            }

            const activeAal = aalData?.currentLevel || 'aal1';
            setCurrentAal(activeAal);

            // If already aal2, no MFA needed
            if (activeAal === 'aal2') {
                console.log('🔐 AAL Level: aal2 - Already verified');
                setMfaRequired(false);
                setMfaChallenge(null);
                return false;
            }

            // 2. Get Factors (Pessimistic check)
            console.log('🔐 MFA: Buscando fatores...');
            const { data: factorsData, error: factorsError } = await withTimeout(supabase.auth.mfa.listFactors());

            // Check factors in both API response and local user metadata for redundancy
            const totpFactors = factorsData?.totp || [];
            const userFactors = user?.factors || [];

            const verifiedFactor = totpFactors.find(f => f.status === 'verified') ||
                userFactors.find(f => f.status === 'verified');

            console.log('🔐 MFA Check - AAL:', aalData?.currentLevel, 'Verified Factor:', verifiedFactor?.id ? 'Found' : 'Not Found');

            if (verifiedFactor && aalData?.currentLevel === 'aal1') {
                // User has MFA but hasn't verified yet - set required immediately (FAIL-CLOSED)
                setMfaRequired(true);

                // 3. Try to create challenge (Most likely to be rate-limited)
                console.log('🔐 MFA: Criando desafio...');
                try {
                    const { data: challengeData, error: challengeError } = await withTimeout(supabase.auth.mfa.challenge({
                        factorId: verifiedFactor.id
                    }), 2000); // 2s timeout for challenge - fast fail

                    if (challengeError) {
                        console.error('🔐 Error creating MFA challenge (likely rate-limited):', challengeError);
                        setMfaChallenge(null); // Will show "Retry" screen
                        return true;
                    }

                    if (challengeData) {
                        setMfaChallenge({ factorId: verifiedFactor.id, challengeId: challengeData.id });
                        // console.log('🔐 MFA Challenge created successfully');
                    }
                } catch (challengeTimeout) {
                    console.warn('🔐 MFA: Timed out creating challenge. User will need to retry.');
                    setMfaChallenge(null);
                }
                return true;
            }

            // Only clear it if we are CERTAIN no MFA is configured (aal1 but no factors)
            if (aalData?.currentLevel === 'aal2' || !verifiedFactor) {
                console.log('🔐 MFA not required (Level:', aalData?.currentLevel, 'Factors:', !!verifiedFactor, ')');
                setMfaRequired(false);
                setMfaChallenge(null);
                return false;
            }

            return mfaRequired === true;
        } catch (err) {
            const isTimeout = err.message === 'MFA call timeout';

            // IF BACKGROUND CHECK (not forced) AND ALREADY VERIFIED (aal2) 
            // DON'T LOCK THE UI ON TIMEOUT
            if (!force && mfaRequired === false && isTimeout) {
                console.log('🔐 MFA: Background check timed out but user is already verified. Maintaining access.');
                return false;
            }

            console.error('🔐 MFA Check failed error:', err);

            // FAIL-CLOSED only if forced or if we don't have a reliable previous state
            const hasFactors = user?.factors?.some(f => f.status === 'verified');
            if (hasFactors && (force || mfaRequired !== false)) {
                console.warn('🔐 MFA: Verification failed/timed out during critical check. Locking gate.');
                setMfaRequired(true);
                return true;
            }

            // Otherwise, maintain current state
            return mfaRequired === true;
        }
    }, [mfaRequired, mfaChallenge, user]);

    // Check for manual WebAuthn credentials
    const checkManualPasskeys = useCallback(async (userId) => {
        if (!userId) {
            setHasManualPasskey(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('webauthn_credentials')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            setHasManualPasskey(!!(data && data.length > 0));
        } catch (err) {
            console.error('Error checking manual passkeys:', err);
            setHasManualPasskey(false);
        }
    }, []);


    useEffect(() => {
        const initializeAuth = async () => {
            // Safety timeout: Ensure loading is ALWAYS turned off even if everything hangs
            const safetyTimeout = setTimeout(() => {
                setLoading(current => {
                    if (current) {
                        console.warn('🔐 Auth initialization timed out - forcing loading off');
                        return false;
                    }
                    return current;
                });
            }, 3000); // Reduced from 5s to 3s for faster UX

            try {
                // Check active session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('🔐 Error getting session:', sessionError);
                    setUser(null);
                    return;
                }

                setUser(session?.user ?? null);
                if (session?.user) {
                    const aal = session.user.app_metadata?.aal || 'aal1';
                    setCurrentAal(aal);

                    // OPTIMIZATION: If session is already aal2, skip network MFA check entirely
                    const hasFactors = session.user.factors?.some(f => f.status === 'verified');
                    if (aal === 'aal2') {
                        setMfaRequired(false);
                        setMfaChallenge(null);
                    } else if (hasFactors) {
                        // Only do network MFA check if we have factors and are at aal1
                        try {
                            await checkMfaRequirement();
                        } catch (mfaError) {
                            console.error('🔐 MFA check error:', mfaError);
                            // Ensure we don't hang if MFA check fails
                            setMfaRequired(hasFactors);
                        }
                    } else {
                        // No factors configured - explicitly set to false
                        console.log('🔐 No MFA factors configured, allowing access');
                        setMfaRequired(false);
                        setCurrentAal('aal1'); // Ensure currentAal is also set
                    }
                }
            } catch (err) {
                console.error('🔐 Auth initialization error:', err);
                setUser(null);
            } finally {
                clearTimeout(safetyTimeout);
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('🔑 Auth State Change:', _event);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // Clear MFA state on sign out
            if (_event === 'SIGNED_OUT') {
                setMfaRequired(false);
                setMfaChallenge(null);
                setHasManualPasskey(false); // Clear passkey state on sign out
                return;
            }

            // Check MFA requirement - OPTIMIZED for speed
            if (currentUser && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED')) {
                const aal = currentUser?.app_metadata?.aal || 'aal1';
                const hasFactors = currentUser.factors?.some(f => f.status === 'verified');

                setCurrentAal(aal);

                // OPTIMIZATION: Skip network call if already aal2
                if (aal === 'aal2') {
                    setMfaRequired(false);
                    setMfaChallenge(null);
                } else if (hasFactors && aal === 'aal1') {
                    // Only do network MFA check if needed
                    try {
                        await checkMfaRequirement();
                    } catch (mfaError) {
                        console.error('🔐 MFA check error:', mfaError);
                        setMfaRequired(hasFactors);
                    }
                } else {
                    // No MFA factors - explicitly allow access
                    console.log('🔐 onAuthStateChange: No MFA factors, allowing access');
                    setMfaRequired(false);
                }
                checkManualPasskeys(currentUser.id); // Check for manual passkeys on auth change
            } else if (!currentUser) {
                // No user session - reset MFA and Passkey state
                setMfaRequired(false);
                setCurrentAal(null);
                setHasManualPasskey(false);
            }
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // CRITICAL: Empty deps to prevent infinite loop. checkMfaRequirement and checkManualPasskeys should NOT reinitialize the auth listener

    // Periodic session validation (every 60 seconds)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            await verifySession();
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, [user, verifySession]);

    // Verify session on window focus (when user returns to tab)
    useEffect(() => {
        if (!user) return;

        const handleFocus = () => {
            verifySession();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, verifySession]);

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signUp = async (email, password, fullName, metadata = {}) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        ...metadata
                    }
                }
            });

            if (error) throw error;
            return { data: null, error };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = useCallback(async () => {
        console.log('🔐 Auth: Iniciando signOut...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.warn('🔐 Auth: Erro no signOut do Supabase:', error);
                // Even on error, we might want to clear local state
            }
            console.log('🔐 Auth: signOut concluído com sucesso.');
            return { error: null };
        } catch (error) {
            console.error('🔐 Auth: Erro fatal no signOut:', error);
            return { error };
        }
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/app`
                }
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    // MFA Methods
    const enrollMFA = async (friendlyName = 'Admin SiG') => {
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName
        });
        return { data, error };
    };

    const challengeMFA = async (factorId) => {
        const { data, error } = await supabase.auth.mfa.challenge({ factorId });
        return { data, error };
    };

    const verifyMFA = async (factorId, challengeId, code) => {
        const { data, error } = await supabase.auth.mfa.verify({
            factorId,
            challengeId,
            code
        });
        return { data, error };
    };

    const getMFAFactors = async () => {
        const { data, error } = await supabase.auth.mfa.listFactors();
        return { data, error };
    };

    const unenrollMFA = async (factorId) => {
        const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
        return { data, error };
    };

    const clearMfaState = useCallback(() => {
        setMfaRequired(false);
        setMfaChallenge(null);
    }, []);

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        verifySession,
        enrollMFA,
        challengeMFA,
        verifyMFA,
        getMFAFactors,
        unenrollMFA,
        mfaRequired,
        mfaChallenge,
        currentAal,
        clearMfaState,
        refreshMfaChallenge: checkMfaRequirement,
        mfaEnabled: user?.factors?.some(f => f.status === 'verified') || hasManualPasskey || false,
        hasManualPasskey,
        checkManualPasskeys
    };

    // --- WebAuthn / Passkeys Implementation (Native Biometrics) ---

    /**
     * Enrolls a new Passkey/Biometric credential for the user.
     * @param {string} friendlyName - e.g. "iPhone de Silvio"
     */
    /**
     * Enrolls a new Passkey/Biometric credential for the user (Manual Flow).
     */
    const enrollPasskey = async (friendlyName = 'Biometria') => {
        try {
            console.log('🔐 WebAuthn: Iniciando cadastro manual...');

            // 1. Get Registration Options from our Edge Function
            const { data: options, error: optionsError } = await supabase.functions.invoke('webauthn-handler?action=register-options', {
                method: 'POST', // Use POST to ensure auth header is sent reliably
                body: {} // Add empty body for standard POST compatibility
            });

            if (optionsError || !options) throw new Error(optionsError?.message || 'Falha ao buscar opções de registro');

            // 2. Browser Ceremony
            const attestationResponse = await startRegistration(options);

            // 3. Verify and Save via our Edge Function
            const { data: verification, error: verifyError } = await supabase.functions.invoke('webauthn-handler?action=register-verify', {
                body: { body: attestationResponse, challenge: options.challenge, friendlyName }
            });

            if (verifyError || !verification.verified) throw new Error(verifyError?.message || 'Falha na verificação da biometria');

            console.log('🔐 WebAuthn: Cadastro manual concluído!');
            // Persist biometric status locally for Login screen convenience
            localStorage.setItem('sig_biometric_enabled', 'true');

            // After successful enrollment, re-check passkeys
            if (user?.id) {
                checkManualPasskeys(user.id);
            }
            return { data: verification, error: null };
        } catch (error) {
            console.error('🔐 WebAuthn Enroll Error:', error);
            // Fallback: If function not deployed, error is clear
            if (error.message?.includes('404')) {
                return { data: null, error: new Error('O servidor de biometria ainda não foi configurado (Edge Function faltando).') };
            }
            return { data: null, error };
        }
    };

    /**
     * Verifies the user using a registered Passkey (Manual Flow).
     */
    const verifyPasskey = async () => {
        try {
            console.log('🔐 WebAuthn: Solicitando digital (Manual)...');

            // 1. Get Authentication Options
            const { data: options, error: optionsError } = await supabase.functions.invoke('webauthn-handler?action=login-options', {
                method: 'GET'
            });

            if (optionsError || !options) throw new Error(optionsError?.message || 'Falha ao buscar opções de login');

            // 2. Browser Ceremony
            const assertionResponse = await startAuthentication(options);

            // 3. Verify via our Edge Function
            const { data: verification, error: verifyError } = await supabase.functions.invoke('webauthn-handler?action=login-verify', {
                body: { body: assertionResponse, challenge: options.challenge }
            });

            if (verifyError) {
                console.error('🔐 WebAuthn: Error in verify call:', verifyError);
                throw new Error(`Erro no servidor (Biometria): ${verifyError.message}`);
            }

            if (!verification || !verification.verified) {
                throw new Error(verification?.error || 'Biometria recusada pelo servidor');
            }

            console.log('🔐 WebAuthn: Login manual verificado!');

            // Set AAL2 locally for the UI
            setCurrentAal('aal2');
            setMfaRequired(false);

            return { data: verification, error: null };
        } catch (error) {
            console.error('🔐 WebAuthn Verify Error:', error);
            // If the error message is too technical, simplify it for the user but keep it log-able
            return { data: null, error };
        }
    };

    // Updated value object with new methods
    const extendedValue = {
        ...value,
        enrollPasskey,
        verifyPasskey
    };

    return (
        <AuthContext.Provider value={extendedValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
