import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as SimpleWebAuthnServer from 'https://esm.sh/@simplewebauthn/server@10.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        console.log(`🔐 Auth header present: ${!!authHeader}, token length: ${token.length}`)

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) {
            console.error('❌ WebAuthn Auth Error:', userError?.message || 'No user found')
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message || 'No valid session' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        console.log(`🔐 User authenticated: ${user.id}`)

        const hostname = origin ? new URL(origin).hostname : 'sigremedios.vercel.app'

        // Dynamic RP ID based on actual hostname
        const rpID = hostname
        const expectedOrigin = [
            'https://sigremedios.vercel.app',
            'https://sigremedios-novo.vercel.app',
            'https://sigremedios-novo-o8lreu3br-silviogregorios-projects.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000'
        ]

        // Add actual origin if it matches vercel pattern or localhost to allow preview branches
        if (origin.includes('.vercel.app') && !expectedOrigin.includes(origin)) {
            expectedOrigin.push(origin)
        }
        // Special case for sigremedios.vercel.app specifically
        if (!expectedOrigin.includes('https://sigremedios.vercel.app')) {
            expectedOrigin.push('https://sigremedios.vercel.app')
        }

        console.log(`🔐 Config: rpID=${rpID} | expectedOrigin=[${expectedOrigin.join(', ')}]`)

        // --- REGISTRO (ENROLLMENT) ---
        if (action === 'register-options') {
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
            const { body, challenge } = await req.json()
            console.log('📡 Verifying registration response...')

            try {
                const verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
                    response: body,
                    expectedChallenge: challenge,
                    expectedOrigin,
                    expectedRPID: rpID,
                })

                console.log(`✅ Verification result: ${verification.verified}`)

                if (verification.verified && verification.registrationInfo) {
                    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

                    const { error: dbError } = await supabaseClient
                        .from('webauthn_credentials')
                        .insert({
                            user_id: user.id,
                            credential_id: btoa(String.fromCharCode(...new Uint8Array(credentialID))),
                            public_key: btoa(String.fromCharCode(...new Uint8Array(credentialPublicKey))),
                            friendly_name: body.friendlyName || 'Meu Dispositivo',
                            counter: counter
                        })

                    if (dbError) {
                        console.error('❌ DB Insert Error:', dbError)
                        throw dbError
                    }

                    console.log('✅ Credential saved to DB')
                    return new Response(JSON.stringify({ verified: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }
                throw new Error('Falha na verificação do registro (biometria rejeitada)')
            } catch (vErr) {
                console.error('❌ verifyRegistrationResponse Exception:', vErr)
                throw vErr
            }
        }

        // --- LOGIN (VERIFY) ---
        if (action === 'login-options') {
            console.log('📡 Generating login options...')
            const { data: credentials, error: credError } = await supabaseClient
                .from('webauthn_credentials')
                .select('credential_id')
                .eq('user_id', user.id)

            if (credError) console.error('❌ DB Select Error:', credError)

            const options = await SimpleWebAuthnServer.generateAuthenticationOptions({
                rpID,
                allowCredentials: credentials?.map(c => ({
                    id: Uint8Array.from(atob(c.credential_id), c => c.charCodeAt(0)),
                    type: 'public-key',
                })),
                userVerification: 'preferred',
            })
            console.log(`✅ Login options generated (${credentials?.length || 0} credentials)`)
            return new Response(JSON.stringify(options), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'login-verify') {
            const { body, challenge } = await req.json()
            console.log(`📡 Verifying login response for credential: ${body.id}`)

            const { data: credential, error: credError } = await supabaseClient
                .from('webauthn_credentials')
                .select('*')
                .eq('credential_id', body.id)
                .single()

            if (credError || !credential) {
                console.error('❌ Credential not found in DB:', credError || 'Not found')
                throw new Error('Credencial não encontrada no servidor')
            }

            try {
                const verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
                    response: body,
                    expectedChallenge: challenge,
                    expectedOrigin,
                    expectedRPID: rpID,
                    authenticator: {
                        credentialID: Uint8Array.from(atob(credential.credential_id), c => c.charCodeAt(0)),
                        credentialPublicKey: Uint8Array.from(atob(credential.public_key), c => c.charCodeAt(0)),
                        counter: Number(credential.counter),
                    },
                })

                console.log(`✅ Login verification: ${verification.verified}`)

                if (verification.verified) {
                    await supabaseClient
                        .from('webauthn_credentials')
                        .update({ counter: verification.authenticationInfo.newCounter })
                        .eq('id', credential.id)

                    return new Response(JSON.stringify({ verified: true }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }
                throw new Error('Falha na verificação da biometria')
            } catch (vErr) {
                console.error('❌ verifyAuthenticationResponse Exception:', vErr)
                throw vErr
            }
        }

        return new Response(JSON.stringify({ error: 'Action not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        })

    } catch (error) {
        console.error('❌ CRITICAL WebAuthn Error:', error.message, error.stack)
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
