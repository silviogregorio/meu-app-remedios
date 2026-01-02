// Supabase Edge Function: sos-push-notification
// Triggered by Database Webhook when a new sos_alert is inserted

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Firebase Cloud Messaging HTTP v1 API
const FCM_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/sig-remedios/messages:send'

// Get Firebase Service Account from env (set in Supabase Dashboard > Edge Functions > Secrets)
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')

// Get access token for FCM
async function getFirebaseAccessToken(): Promise<string> {
    if (!FIREBASE_SERVICE_ACCOUNT) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT not configured')
    }

    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)

    // Create JWT for Google OAuth
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/firebase.messaging'
    }

    // Encode JWT parts
    const encoder = new TextEncoder()
    const base64url = (data: Uint8Array) =>
        btoa(String.fromCharCode(...data))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')

    const headerB64 = base64url(encoder.encode(JSON.stringify(header)))
    const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)))
    const signInput = `${headerB64}.${payloadB64}`

    // Import private key and sign
    const pemContents = serviceAccount.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\n/g, '')

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(signInput)
    )

    const jwt = `${signInput}.${base64url(new Uint8Array(signature))}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
        throw new Error('Failed to get Firebase access token: ' + JSON.stringify(tokenData))
    }

    return tokenData.access_token
}

// Send push notification via FCM HTTP v1
async function sendPushNotification(tokens: string[], title: string, body: string, data: Record<string, string>) {
    const accessToken = await getFirebaseAccessToken()

    const results = await Promise.allSettled(
        tokens.map(async (token, index) => {
            console.log(`📤 Sending to token ${index + 1}/${tokens.length}: ${token.substring(0, 20)}...`)

            const message = {
                message: {
                    token,
                    data: {
                        title,
                        body,
                        ...data,
                        icon: 'https://sigremedios.vercel.app/pwa-192x192.png',
                        timestamp: Date.now().toString()
                    },
                    webpush: {
                        headers: { Urgency: 'high', TTL: '86400' }
                    },
                    android: {
                        priority: 'high'
                    }
                }
            }

            const response = await fetch(FCM_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })

            if (!response.ok) {
                const error = await response.text()
                console.error(`❌ Token ${index + 1} FAILED:`, error)
                throw new Error(`FCM Error: ${error}`)
            }

            const result = await response.json()
            console.log(`✅ Token ${index + 1} SUCCESS:`, JSON.stringify(result))
            return result
        })
    )

    const success = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Log detailed failures
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`Token ${i + 1} error details:`, (r as PromiseRejectedResult).reason)
        }
    })

    console.log(`📱 FCM SUMMARY: ${success} success, ${failed} failed out of ${tokens.length} tokens`)

    return { successCount: success, failureCount: failed }
}

// Main handler
Deno.serve(async (req) => {
    try {
        const payload = await req.json()
        console.log('🚨 SOS Edge Function triggered')
        console.log('Payload:', JSON.stringify(payload, null, 2))

        // Get the alert from the webhook payload
        const alert = payload.record
        const eventType = payload.type // 'INSERT' or 'UPDATE'

        if (!alert) {
            return new Response(JSON.stringify({ error: 'No record in payload' }), { status: 400 })
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Get patient info
        const { data: patient } = await supabase
            .from('patients')
            .select('*')
            .eq('id', alert.patient_id)
            .single()

        // Handle UPDATE (acknowledgment) - notify the patient that help is coming
        if (eventType === 'UPDATE' && alert.status === 'acknowledged' && alert.acknowledged_by) {
            console.log('✅ SOS was ACKNOWLEDGED - notifying patient')

            // Get the profile of who acknowledged
            const { data: acknowledger } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', alert.acknowledged_by)
                .single()

            const acknowledgerName = acknowledger?.full_name || acknowledger?.email || 'Alguém'

            // Get FCM token of the person who TRIGGERED the alert (the patient/caregiver in danger)
            const { data: tokens } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', alert.triggered_by)

            if (tokens && tokens.length > 0) {
                const fcmTokens = tokens.map((t: any) => t.token)

                await sendPushNotification(fcmTokens, '✅ AJUDA A CAMINHO!', `${acknowledgerName} viu seu alerta e está a caminho!`, {
                    type: 'sos_acknowledged',
                    alertId: String(alert.id),
                    appUrl: 'https://sigremedios.vercel.app/',
                    patientName: patient?.name || 'Paciente'
                })

                console.log('✅ Acknowledgment notification sent to patient')
            }

            return new Response(JSON.stringify({ success: true, type: 'acknowledged' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // Handle INSERT - notify caregivers about the new SOS
        if (eventType === 'INSERT') {
            // 2. Get user profile who triggered the alert
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', alert.triggered_by)
                .single()

            // 3. Get FCM tokens for users who should receive the notification
            const userIds = [patient?.user_id, alert.triggered_by].filter(Boolean)

            // Also get tokens from caregivers (people who have access to this patient)
            const { data: shares } = await supabase
                .from('patient_shares')
                .select('shared_with_user_id')
                .eq('patient_id', patient?.id)
                .eq('status', 'accepted')

            if (shares) {
                shares.forEach((s: any) => {
                    if (s.shared_with_user_id) userIds.push(s.shared_with_user_id)
                })
            }

            const { data: tokens } = await supabase
                .from('fcm_tokens')
                .select('token')
                .in('user_id', userIds)

            if (!tokens || tokens.length === 0) {
                console.log('⚠️ No FCM tokens found')
                return new Response(JSON.stringify({ success: true, message: 'No tokens to notify' }), { status: 200 })
            }

            // 4. Build notification content
            const isHelpRequest = alert.alert_type === 'help_request'
            const pushTitle = isHelpRequest ? '💡 PEDIDO DE AJUDA' : '🚨 EMERGÊNCIA SOS'

            const locationUrl = (alert.location_lat && alert.location_lng)
                ? `https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`
                : 'https://sigremedios.vercel.app'

            const pushBody = isHelpRequest
                ? `${patient?.name || 'Alguém'} precisa de ajuda com o aplicativo.`
                : `${patient?.name || 'Alguém'} PRECISA DE AJUDA URGENTE!`

            const fcmTokens = tokens.map((t: any) => t.token)

            // 5. Send push notification
            await sendPushNotification(fcmTokens, pushTitle, pushBody, {
                type: isHelpRequest ? 'help_request' : 'sos',
                alertId: String(alert.id),
                mapUrl: locationUrl,
                appUrl: 'https://sigremedios.vercel.app/',
                phone: userProfile?.phone || patient?.phone || '',
                patientName: patient?.name || 'Alguém'
            })

            console.log('✅ SOS push notification sent successfully')
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        console.error('❌ Error in SOS Edge Function:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
