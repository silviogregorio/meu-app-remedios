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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '') ?? ''

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) {
            console.error('❌ WebAuthn Auth Error:', userError)
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const url = new URL(req.url)
        const action = url.searchParams.get('action')
        const origin = req.headers.get('origin') || ''

        // Dynamic RP ID based on origin
        const rpID = origin.includes('localhost') ? 'localhost' : 'sigremedios.vercel.app'
        const expectedOrigin = [
            'https://sigremedios.vercel.app',
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        ]

        console.log(`🔐 WebAuthn Action: ${action} | Origin: ${origin} | RPID: ${rpID}`)

        // --- REGISTRO (ENROLLMENT) ---
        if (action === 'register-options') {
            const options = await SimpleWebAuthnServer.generateRegistrationOptions({
                rpName: 'SiG Remédios',
                rpID,
                userID: new TextEncoder().encode(user.id), // MUST BE UINT8ARRAY
                userName: user.email ?? user.id,
                attestationType: 'none',
                authenticatorSelection: {
                    residentKey: 'preferred',
                    userVerification: 'preferred',
                },
            })

            return new Response(JSON.stringify(options), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'register-verify') {
            const { body, challenge } = await req.json()

            const verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
                response: body,
                expectedChallenge: challenge,
                expectedOrigin,
                expectedRPID: rpID,
            })

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

                if (dbError) throw dbError

                return new Response(JSON.stringify({ verified: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
            throw new Error('Falha na verificação do registro')
        }

        // --- LOGIN (VERIFY) ---
        if (action === 'login-options') {
            const { data: credentials } = await supabaseClient
                .from('webauthn_credentials')
                .select('credential_id')
                .eq('user_id', user.id)

            const options = await SimpleWebAuthnServer.generateAuthenticationOptions({
                rpID,
                allowCredentials: credentials?.map(c => ({
                    id: Uint8Array.from(atob(c.credential_id), c => c.charCodeAt(0)),
                    type: 'public-key',
                })),
                userVerification: 'preferred',
            })

            return new Response(JSON.stringify(options), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'login-verify') {
            const { body, challenge } = await req.json()

            const { data: credential } = await supabaseClient
                .from('webauthn_credentials')
                .select('*')
                .eq('credential_id', body.id)
                .single()

            if (!credential) throw new Error('Credencial não encontrada')

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
            throw new Error('Falha na verificação da assinatura')
        }

        return new Response(JSON.stringify({ error: 'Action not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        })

    } catch (error) {
        console.error('❌ WebAuthn Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
