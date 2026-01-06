import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as SimpleWebAuthnServer from 'https://esm.sh/@simplewebauthn/server@10.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to convert Uint8Array to Base64URL (no padding)
function bufferToBase64URL(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to convert Base64/Base64URL to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
    // Normalize Base64URL to standard Base64
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(normalized);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const action = url.searchParams.get('action')
        const origin = req.headers.get('origin') || ''

        console.log(`🔐 WebAuthn Request: action=${action} origin=${origin}`)

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '') ?? ''

        // Safe user fetch
        let user = null;
        if (token) {
            try {
                const { data: authData, error: authError } = await supabaseClient.auth.getUser(token)
                if (!authError && authData) {
                    user = authData.user;
                }
            } catch (e) {
                console.log('🔐 Auth token check failed (likely expired/invalid)')
            }
        }

        if (user) {
            console.log(`🔐 Session found for user: ${user.id}`)
        } else {
            console.log(`🔐 No active session (Anonymous request)`)
        }

        let hostname = 'sigremedios.vercel.app';
        if (origin) {
            try {
                hostname = new URL(origin).hostname;
            } catch (e) {
                console.warn('⚠️ Invalid origin URL:', origin);
                hostname = origin.split('://')[1]?.split(':')[0] || origin;
            }
        }
        const rpID = hostname

        // Base whitelist
        const expectedOrigin = [
            'https://sigremedios.vercel.app',
            'https://sigremedios-novo.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000'
        ]

        // Add received origin if safely valid (Vercel or Localhost)
        if (origin && !expectedOrigin.includes(origin)) {
            if (origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                console.log(`🔐 Dynamically whitelisting origin: ${origin}`)
                expectedOrigin.push(origin)
            }
        }

        console.log(`🔐 WebAuthn Config: rpID=${rpID} | expectedOrigin=[${expectedOrigin.join(', ')}] | receivedOrigin=${origin}`)

        // --- REGISTRO (ENROLLMENT) ---
        if (action === 'register-options') {
            if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: corsHeaders, status: 401 })

            console.log('📡 Generating registration options...')
            const options = await SimpleWebAuthnServer.generateRegistrationOptions({
                rpName: 'SiG Remédios',
                rpID,
                userID: new TextEncoder().encode(user.id),
                userName: user.email ?? user.id,
                attestationType: 'none',
                authenticatorSelection: {
                    residentKey: 'preferred',
                    userVerification: 'preferred',
                },
            })
            console.log('✅ Registration options generated')
            return new Response(JSON.stringify(options), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'register-verify') {
            console.log('📡 register-verify: START', { user_id: user?.id, has_user: !!user });
            if (!user) {
                console.error('❌ register-verify: No authenticated user');
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: corsHeaders, status: 401 })
            }

            let json;
            try {
                json = await req.json();
                console.log('📡 register-verify: JSON parsed successfully', { has_body: !!json.body, has_challenge: !!json.challenge });
            } catch (parseErr) {
                console.error('❌ register-verify: JSON parse failed', parseErr);
                return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }

            const { body, challenge, friendlyName } = json
            console.log('📡 register-verify: Verifying registration response...', { challenge, rpID, origin, friendlyName })

            try {
                console.log('📡 register-verify: Calling verifyRegistrationResponse with', {
                    expectedChallenge: challenge,
                    expectedOrigin,
                    expectedRPID: rpID
                });
                const verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
                    response: body,
                    expectedChallenge: challenge,
                    expectedOrigin,
                    expectedRPID: rpID,
                })
                console.log('✅ register-verify: Verification result', { verified: verification.verified });

                if (verification.verified && verification.registrationInfo) {
                    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

                    // Save using standardized Base64URL
                    const encodedID = bufferToBase64URL(credentialID);
                    const encodedPublicKey = bufferToBase64URL(credentialPublicKey);

                    console.log('📡 register-verify: Saving to DB', {
                        user_id: user.id,
                        credential_id_preview: encodedID.substring(0, 10),
                        friendly_name: friendlyName || 'Meu Dispositivo'
                    });

                    const { error: dbError } = await supabaseClient
                        .from('webauthn_credentials')
                        .insert({
                            user_id: user.id,
                            credential_id: encodedID,
                            public_key: encodedPublicKey,
                            friendly_name: friendlyName || 'Meu Dispositivo',
                            counter: counter
                        })

                    if (dbError) {
                        console.error('❌ register-verify: DB Error', dbError);
                        throw dbError;
                    }

                    console.log(`✅ Credential saved to DB: ${encodedID.substring(0, 10)}...`)
                    return new Response(JSON.stringify({ verified: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }
                throw new Error('Falha na verificação do registro')
            } catch (vErr) {
                console.error('❌ Registration Verification Error:', vErr)
                throw vErr
            }
        }

        // --- LOGIN (VERIFY) ---
        if (action === 'login-options') {
            console.log('📡 Generating login options...')
            let allowCredentials = undefined

            // If user is already logged in (MFA flow), restrict to their credentials
            if (user) {
                const { data: credentials } = await supabaseClient
                    .from('webauthn_credentials')
                    .select('credential_id')
                    .eq('user_id', user.id)

                if (credentials && credentials.length > 0) {
                    allowCredentials = credentials.map(c => ({
                        id: base64ToBuffer(c.credential_id),
                        type: 'public-key',
                    }))
                }
            }

            const options = await SimpleWebAuthnServer.generateAuthenticationOptions({
                rpID,
                allowCredentials,
                userVerification: 'preferred',
            })
            console.log(`✅ Login options generated (${allowCredentials ? allowCredentials.length : 'all'} credentials allowed)`)
            return new Response(JSON.stringify(options), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'login-verify') {
            console.log('📡 login-verify: received request');
            const json = await req.json()
            const { body, challenge } = json
            console.log(`📡 Verifying login response for credential: ${body.id}`, { challenge, rpID, origin })

            // Match requires searching for the ID. Browsers send Base64URL. 
            // We search for the exact string or the normalized standard Base64 variant to be sure.
            const searchId = body.id;
            const altId = body.id.replace(/-/g, '+').replace(/_/g, '/');

            const { data: credential, error: credError } = await supabaseClient
                .from('webauthn_credentials')
                .select('*')
                .or(`credential_id.eq."${searchId}",credential_id.eq."${altId}"`)
                .maybeSingle()

            if (credError || !credential) {
                console.error('❌ Credential not found in DB:', searchId)
                throw new Error('Biometria não reconhecida. Por favor, entre com senha e cadastre novamente no perfil.')
            }

            try {
                const verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
                    response: body,
                    expectedChallenge: challenge,
                    expectedOrigin,
                    expectedRPID: rpID,
                    authenticator: {
                        credentialID: base64ToBuffer(credential.credential_id),
                        credentialPublicKey: base64ToBuffer(credential.public_key),
                        counter: Number(credential.counter),
                    },
                })

                if (verification.verified) {
                    await supabaseClient
                        .from('webauthn_credentials')
                        .update({ counter: verification.authenticationInfo.newCounter })
                        .eq('id', credential.id)

                    return new Response(JSON.stringify({
                        verified: true,
                        user_id: credential.user_id
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }
                throw new Error('Falha na verificação da biometria')
            } catch (vErr) {
                console.error('❌ Login Verification Error:', vErr)
                throw vErr
            }
        }

        return new Response(JSON.stringify({ error: 'Action not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        })

    } catch (error) {
        console.error('❌ CRITICAL WebAuthn Error:', error.message)
        return new Response(JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
