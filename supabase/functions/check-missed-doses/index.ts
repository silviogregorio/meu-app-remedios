import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Init Client (Service Role Token needed to access all users' data)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const now = new Date();
        // Default to Sao Paulo time for calculation logic if not strictly stored with TZ
        // Ideally this comes from user profile timezone, but simplified for MVP:
        // We'll iterate assuming the "Date" strings in DB are local to the user.
        // For specific times, we compare vs Realtime.

        // FETCH 1: Active Prescriptions
        const { data: prescriptions, error: pError } = await supabase
            .from('prescriptions')
            .select(`
            *,
            patient:patients (name, user_id),
            medication:medications (name)
        `)
            .eq('active', true);

        if (pError) throw pError;

        const results = [];

        // Iterate Prescriptions
        for (const prescription of prescriptions) {
            if (!prescription.times || !Array.isArray(prescription.times)) continue;

            const patientId = prescription.patientId || prescription.patient_id;
            const medName = prescription.medication?.name || 'Medicamento';
            const patientName = prescription.patient?.name || 'Paciente';

            // Check each scheduled time
            for (const timeStr of prescription.times) {
                // timeStr is "HH:mm" (e.g. "08:00")
                const [hours, minutes] = timeStr.split(':').map(Number);
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, minutes, 0, 0);

                // Time Diff in Minutes
                const diffMs = now.getTime() - scheduledDate.getTime();
                const diffMins = diffMs / (1000 * 60);

                // Logic:
                // 1. Must be IN THE PAST (> 0)
                // 2. Must be MORE than 30 mins late (diffMins > 30)
                // 3. Must NOT require alerting if it's from yesterday (diffMins < 24h aka 1440m)
                //    (Simplified: we only run for "today" schedule)

                if (diffMins > 30 && diffMins < 1440) {
                    // POTENTIAL MISSED DOSE
                    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

                    // CHECK 1: Consumption Log
                    const { data: consumption } = await supabase
                        .from('consumption_log')
                        .select('id')
                        .eq('prescription_id', prescription.id)
                        .eq('date', todayStr)
                        .eq('scheduled_time', timeStr) // Exact match on plan
                        .maybeSingle();

                    if (consumption) continue; // Taken! All good.

                    // CHECK 2: Already Alerted?
                    const { data: alertLog } = await supabase
                        .from('alert_logs')
                        .select('id')
                        .eq('prescription_id', prescription.id)
                        .eq('alert_date', todayStr)
                        .eq('alert_time', timeStr + ':00') // DB Time might need seconds
                        .maybeSingle();

                    if (alertLog) continue; // Already warned today.

                    // === FIRE ALERT ===

                    // 1. Find Caregivers (Owner + Shared)
                    const { data: shares } = await supabase
                        .from('patient_shares')
                        .select('shared_with_email')
                        .eq('patient_id', patientId)
                        .eq('status', 'accepted');

                    // Owner Email
                    const { data: ownerProfile } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', prescription.patient.user_id)
                        .single();

                    const recipients = [];
                    if (ownerProfile?.email) recipients.push(ownerProfile.email);
                    if (shares) shares.forEach(s => recipients.push(s.shared_with_email));

                    if (recipients.length === 0) continue;

                    // 2. Send Email (using our existing generic send-email endpoint logic or direct SMTP here)
                    // For safety in Edge Function, we'll re-use the logic or call the API. 
                    // Here assuming we use Resend/Nodemailer directly or call another function?
                    // Let's assume we call an internal helper or just Mock logging for now if no SMTP key in this specific file.
                    // Ideally, we POST to our own /send-email function or implement nodemailer here.

                    console.log(`Sending Alert for ${patientName} - ${medName} to ${recipients.join(', ')}`);

                    // CALL EXISTING SEND-EMAIL FUNCTION (Internal Call)
                    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            to: recipients.join(','), // our API handles comma
                            subject: `⚠️ AVISO: Atraso de Remédio - ${patientName}`,
                            text: `O paciente ${patientName} NÃO marcou o medicamento ${medName} das ${timeStr} como tomado.\nJá se passaram mais de 30 minutos.`,
                            html: `<p><strong>Alerta de Cuidador</strong></p><p>O paciente <strong>${patientName}</strong> não registrou o medicamento <strong>${medName}</strong>.</p><p>Horário agendado: ${timeStr}</p><p>Atraso detectado > 30 minutos.</p>`,
                            type: 'alert'
                        })
                    });

                    // 3. Log Alert
                    await supabase.from('alert_logs').insert({
                        prescription_id: prescription.id,
                        patient_id: patientId,
                        alert_date: todayStr,
                        alert_time: timeStr,
                        sent_to: recipients
                    });

                    results.push({ patient: patientName, med: medName, time: timeStr, sent_to: recipients });
                }
            }
        }

        return new Response(JSON.stringify({ success: true, alerts_sent: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
