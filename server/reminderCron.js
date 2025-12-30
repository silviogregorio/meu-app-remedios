import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { initFirebaseAdmin, sendPushNotification } from './firebaseAdmin.js';

let _supabaseClient = null;
const getSupabase = () => {
    if (!_supabaseClient) {
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Supabase URL ou Key não encontrados no ambiente.');
        }

        _supabaseClient = createClient(url, key);
    }
    return _supabaseClient;
};

/**
 * Gets current time in America/Sao_Paulo
 */
const getRegionalTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;

    const datePart = new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD
        timeZone: 'America/Sao_Paulo'
    }).format(now);

    return {
        time: `${hour}:${minute}`,
        date: datePart
    };
};

/**
 * Main function to check and send reminders
 */
export const checkAndSendReminders = async () => {
    try {
        const supabase = getSupabase();

        // 1. Get Delay Config
        const { data: config } = await supabase
            .from('system_settings')
            .select('take_reminder_delay_minutes')
            .eq('key', 'alerts')
            .single();

        const delay = config?.take_reminder_delay_minutes || 15;

        // 2. Calculate Target Time (now - delay)
        const now = new Date();
        const targetMs = now.getTime() - (delay * 60 * 1000);
        const targetDateObj = new Date(targetMs);

        const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const parts = timeFormatter.formatToParts(targetDateObj);
        const targetTime = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}`;

        const targetDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo'
        }).format(targetDateObj);

        console.log(`🔔 [REMINDER] Scanning for missed doses scheduled at ${targetTime} (${targetDate})...`);

        // 3. Query RPC for missed doses
        const { data: missedDoses, error } = await supabase.rpc('get_missed_doses', {
            p_target_time: targetTime,
            p_target_date: targetDate
        });

        if (error) throw error;

        if (!missedDoses || missedDoses.length === 0) {
            return;
        }

        console.log(`🔔 [REMINDER] Found ${missedDoses.length} missed doses. Processing...`);

        // 4. Group by User to send notifications (optimization)
        const userMap = new Map();
        for (const dose of missedDoses) {
            if (!userMap.has(dose.patient_user_id)) {
                userMap.set(dose.patient_user_id, []);
            }
            userMap.get(dose.patient_user_id).push(dose);
        }

        // 5. Send notifications
        for (const [userId, doses] of userMap.entries()) {
            // Check if user is in vacation mode
            const { data: profile } = await supabase
                .from('profiles')
                .select('vacation_mode')
                .eq('id', userId)
                .single();

            if (profile?.vacation_mode) {
                console.log(`🏖️ [REMINDER] User ${userId} is in Vacation Mode. Skipping notifications.`);
                continue;
            }

            // Get tokens for this user
            const { data: tokens } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', userId);

            if (tokens && tokens.length > 0) {
                const tokenList = tokens.map(t => t.token);

                // If multiple doses, summarize, otherwise be specific
                const patientName = doses[0].patient_name;
                const title = `🔔 Lembrete: Hora do Cuidado!`;

                let body;
                if (doses.length === 1) {
                    body = `💊 ${patientName} ainda não tomou o ${doses[0].medicine_name} (atraso de ${delay} min). Vamos registrar?`;
                } else {
                    body = `⚠️ ${patientName} tem ${doses.length} doses atrasadas há ${delay} min. Toque para verificar agora! 💊`;
                }

                try {
                    await sendPushNotification(tokenList, title, body, {
                        type: 'reminder',
                        prescriptionIds: doses.map(d => d.prescription_id).join(','),
                        patientName: patientName,
                        targetTime
                    });
                    console.log(`✅ [REMINDER] Sent to user ${userId} (${doses.length} doses)`);
                } catch (pushErr) {
                    console.error(`❌ [REMINDER] Failed to send to user ${userId}:`, pushErr.message);
                }
            }

            // 6. Caregiver Escalation (New)
            // If the delay is significant (e.g., 40 minutes), notify caregivers too
            const escalationDelayThreshold = 40;
            const currentDelay = (now.getTime() - targetDateObj.getTime()) / (60 * 1000) + delay;

            // Note: targetTime is already shifted by 'delay'. 
            // We need to check if we are 40 minutes past the ORIGINAL scheduled time.
            // Actually, we can just run a SECOND scan in the same cron for the -40min mark.
        }

        // --- SECOND SCAN: Caregiver Escalation (40 min delay) ---
        const escalationDelay = 40;
        const escTargetMs = now.getTime() - (escalationDelay * 60 * 1000);
        const escTargetDateObj = new Date(escTargetMs);
        const escParts = timeFormatter.formatToParts(escTargetDateObj);
        const escTargetTime = `${escParts.find(p => p.type === 'hour').value}:${escParts.find(p => p.type === 'minute').value}`;
        const escTargetDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(escTargetDateObj);

        console.log(`📢 [ESCALATION] Scanning for doses late by ${escalationDelay}m (Scheduled at ${escTargetTime})...`);

        const { data: lateDoses } = await supabase.rpc('get_missed_doses', {
            p_target_time: escTargetTime,
            p_target_date: escTargetDate
        });

        if (lateDoses && lateDoses.length > 0) {
            for (const dose of lateDoses) {
                // Get caregivers for this patient
                const { data: shares } = await supabase
                    .from('patient_shares')
                    .select('shared_with_email')
                    .eq('patient_id', dose.patient_id)
                    .eq('status', 'accepted');

                if (shares && shares.length > 0) {
                    const caregiverEmails = shares.map(s => s.shared_with_email);

                    // Get tokens for these caregivers via profiles
                    const { data: caregiverTokens } = await supabase
                        .from('fcm_tokens')
                        .select('token')
                        .in('user_id', (
                            await supabase.from('profiles').select('id').in('email', caregiverEmails)
                        ).data?.map(p => p.id) || []);

                    if (caregiverTokens && caregiverTokens.length > 0) {
                        const tokenList = caregiverTokens.map(t => t.token);
                        const title = `⚠️ Alerta de Atraso: ${dose.patient_name}`;
                        const body = `O paciente ${dose.patient_name} ainda não tomou o remédio ${dose.medicine_name} agendado para as ${escTargetTime}. Verifique o que houve.`;

                        await sendPushNotification(tokenList, title, body, {
                            type: 'caregiver_alert',
                            patientId: dose.patient_id,
                            medicationName: dose.medicine_name
                        });
                        console.log(`📡 [ESCALATION] Alert sent to ${caregiverTokens.length} caregivers for ${dose.patient_name}`);
                    }
                }
            }
        }

    } catch (err) {
        console.error('❌ [REMINDER] Error in cron job:', err);
    }
};

/**
 * Starts the cron job
 */
export const startReminderCron = () => {
    console.log('🔔 Configurando cron job de lembrete "Você tomou?"...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            console.log('⏰ [CRON] Triggered: checkAndSendReminders');
            await checkAndSendReminders();
        } catch (cronErr) {
            console.error('❌ [CRON ERROR] reminderCron:', cronErr);
        }
    });

    console.log('✅ Cron job de lembrete ativado (Execução: 1x por minuto)');
};
