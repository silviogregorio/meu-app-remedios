import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaChallenge, setMfaChallenge] = useState(null); // { factorId, challengeId }

    // Check if user needs MFA verification (has factors but session is aal1)
    const checkMfaRequirement = useCallback(async () => {
        try {
            const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalError) {
                console.warn('🔐 Error getting AAL:', aalError);
                return false;
            }

            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) {
                console.warn('🔐 Error listing factors:', factorsError);
                return false;
            }

            const verifiedFactor = factorsData?.totp?.find(f => f.status === 'verified');

            console.log('🔐 AAL Level:', aalData?.currentLevel, 'Has verified TOTP:', !!verifiedFactor);

            if (verifiedFactor && aalData?.currentLevel === 'aal1') {
                // User has MFA but hasn't verified yet - create challenge
                const { data: challengeData, error } = await supabase.auth.mfa.challenge({
                    factorId: verifiedFactor.id
                });

                if (!error && challengeData) {
                    setMfaChallenge({ factorId: verifiedFactor.id, challengeId: challengeData.id });
                    setMfaRequired(true);
                    console.log('🔐 MFA Challenge created, user needs to verify');
                    return true;
                }
            }

            setMfaRequired(false);
            setMfaChallenge(null);
            return false;
        } catch (err) {
            console.error('🔐 MFA Check failed:', err);
            setMfaRequired(false);
            setMfaChallenge(null);
            return false;
        }
    }, []);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);

            // MFA check temporarily disabled to prevent blocking
            // if (session?.user) {
            //     await checkMfaRequirement();
            // }

            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);

            // MFA check temporarily disabled
            // if (session?.user && _event === 'SIGNED_IN') {
            //     await checkMfaRequirement();
            // }
        });

        return () => subscription.unsubscribe();
    }, []);

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
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    };

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
        clearMfaState,
        mfaEnabled: user?.factors?.some(f => f.status === 'verified') || false
    };

    return (
        <AuthContext.Provider value={value}>
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
