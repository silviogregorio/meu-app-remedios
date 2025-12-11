import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const config = {
    runtime: 'edge',
}

export default async function handler(req) {
    // Security: Check for cron secret or authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        const now = new Date()
        const results = []

        // 1. Fetch all active prescriptions
        const { data: prescriptions, error: pError } = await supabase
            .from('prescriptions')
            .select(`
        *,
        patient:patients (name, user_id),
        medication:medications (name)
      `)
            .eq('active', true)

        if (pError) throw pError

        // 2. Iterate and check for missed doses
        for (const prescription of prescriptions) {
            if (!prescription.times || !Array.isArray(prescription.times)) continue

            const patientId = prescription.patientId || prescription.patient_id
            const medName = prescription.medication?.name || 'Medicamento'
            const patientName = prescription.patient?.name || 'Paciente'

            for (const timeStr of prescription.times) {
                const [hours, minutes] = timeStr.split(':').map(Number)
                const scheduledDate = new Date()
                scheduledDate.setHours(hours, minutes, 0, 0)

                const diffMs = now.getTime() - scheduledDate.getTime()
                const diffMins = diffMs / (1000 * 60)

                // Check if dose is late (> 30 mins and < 24 hours)
                if (diffMins > 30 && diffMins < 1440) {
                    const todayStr = now.toISOString().split('T')[0]

                    // Check consumption log
                    const { data: consumption } = await supabase
                        .from('consumption_log')
                        .select('id')
                        .eq('prescription_id', prescription.id)
                        .eq('date', todayStr)
                        .eq('scheduled_time', timeStr)
                        .maybeSingle()

                    if (consumption) continue // Already taken

                    // Check if alert already sent today
                    const { data: alertLog } = await supabase
                        .from('alert_logs')
                        .select('id')
                        .eq('prescription_id', prescription.id)
                        .eq('alert_date', todayStr)
                        .eq('alert_time', timeStr + ':00')
                        .maybeSingle()

                    if (alertLog) continue // Already alerted

                    // === SEND ALERT ===

                    // Get caregivers (owner + shared users)
                    const { data: shares } = await supabase
                        .from('patient_shares')
                        .select('shared_with_email')
                        .eq('patient_id', patientId)
                        .eq('status', 'accepted')

                    // Get owner email
                    const { data: ownerProfile } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', prescription.patient.user_id)
                        .single()

                    const recipients = []
                    if (ownerProfile?.email) recipients.push(ownerProfile.email)
                    if (shares) shares.forEach(s => recipients.push(s.shared_with_email))

                    if (recipients.length === 0) continue

                    // Send email using existing send-email function
                    try {
                        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                to: recipients.join(','),
                                subject: `⚠️ AVISO: Atraso de Remédio - ${patientName}`,
                                text: `O paciente ${patientName} NÃO marcou o medicamento ${medName} das ${timeStr} como tomado.\nJá se passaram mais de 30 minutos.`,
                                html: `<p><strong>Alerta de Cuidador</strong></p><p>O paciente <strong>${patientName}</strong> não registrou o medicamento <strong>${medName}</strong>.</p><p>Horário agendado: ${timeStr}</p><p>Atraso detectado > 30 minutos.</p>`,
                                type: 'alert'
                            })
                        })

                        // Log the alert
                        await supabase.from('alert_logs').insert({
                            prescription_id: prescription.id,
                            patient_id: patientId,
                            alert_date: todayStr,
                            alert_time: timeStr,
                            sent_to: recipients
                        })

                        results.push({
                            patient: patientName,
                            medication: medName,
                            time: timeStr,
                            recipients
                        })
                    } catch (err) {
                        console.error('Failed to send alert:', err)
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                alerts_sent: results.length,
                details: results
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Cron job error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}
