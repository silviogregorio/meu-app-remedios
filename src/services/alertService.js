import { supabase } from '../lib/supabase';
import { getISODate } from '../utils/dateFormatter';

export const AlertService = {
    calculateStockDays: (medicationId, medications, prescriptions) => {
        const med = medications.find(m => m.id === medicationId);
        if (!med || !med.quantity) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activePrescriptions = prescriptions.filter(p =>
            p.medicationId === medicationId &&
            p.active !== false &&
            (!p.endDate || new Date(p.endDate) >= today)
        );

        if (activePrescriptions.length === 0) return null;

        let dailyUsage = 0;
        activePrescriptions.forEach(p => {
            const dose = parseFloat(p.doseAmount) || 1;
            const freq = p.times ? p.times.length : 0;
            dailyUsage += (dose * freq);
        });

        if (dailyUsage <= 0) return null;

        return med.quantity / dailyUsage;
    },

    checkLowStock: async (medicationId, user, medications, prescriptions, patients, showToast) => {
        const daysRemaining = AlertService.calculateStockDays(medicationId, medications, prescriptions);
        if (daysRemaining === null) return;

        const med = medications.find(m => m.id === medicationId);
        if (!med) return;

        try {
            // 1. Buscar configuração dinâmica do threshold
            const { data: config } = await supabase
                .from('system_settings')
                .select('low_stock_threshold_days')
                .eq('key', 'alerts')
                .single();

            const threshold = config?.low_stock_threshold_days || 4; // Padrão 4 dias

            // Verificar se está abaixo do threshold
            if (daysRemaining > threshold) return;

            // 2. Calcular uso diário
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activePrescriptions = prescriptions.filter(p =>
                p.medicationId === medicationId &&
                p.active !== false &&
                (!p.endDate || new Date(p.endDate) >= today)
            );

            let dailyUsage = 0;
            activePrescriptions.forEach(p => {
                const dose = parseFloat(p.doseAmount) || 1;
                const freq = p.times ? p.times.length : 0;
                dailyUsage += (dose * freq);
            });

            // 3. Buscar paciente relacionado
            const relatedPrescription = activePrescriptions[0];
            if (!relatedPrescription) return;

            const patient = patients.find(p => p.id === relatedPrescription.patientId);
            if (!patient) return;

            const daysDisplay = Math.floor(daysRemaining);

            // Alerta Visual (Toast) para o usuário atual
            const { formatLowStockMessage } = await import('../utils/whatsappUtils');
            showToast(formatLowStockMessage(med.name, daysRemaining), 'warning');

            // 4. Throttling: Verificar se já alertou hoje
            const todayStr = getISODate();
            if (med.last_alert_date === todayStr) {
                console.log('Alerta de estoque já enviado hoje para', med.name);
                return;
            }

            // 5. Atualizar DB PRIMEIRO para evitar race condition
            const { error: updateError } = await supabase
                .from('medications')
                .update({ last_alert_date: todayStr })
                .eq('id', med.id);

            if (updateError) throw updateError;

            // 6. Buscar destinatários: dono + cuidadores
            const recipients = [];
            recipients.push({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name });

            // Buscar cuidadores do paciente
            if (patient.sharedWith && patient.sharedWith.length > 0) {
                for (const share of patient.sharedWith) {
                    if (share.status === 'accepted') {
                        const { data: caregiver } = await supabase
                            .from('profiles')
                            .select('id, email, full_name')
                            .eq('email', share.email)
                            .single();

                        if (caregiver && caregiver.email !== user.email) {
                            recipients.push(caregiver);
                        }
                    }
                }
            }

            // 7. Gerar link WhatsApp e quantidade sugerida
            const { generatePharmacyWhatsAppLink, calculateSuggestedQuantity } = await import('../utils/whatsappUtils');
            const whatsappLink = generatePharmacyWhatsAppLink(med, patient, daysRemaining);
            const suggestedQuantity = calculateSuggestedQuantity(med);

            // 8. Enviar notificações para TODOS os destinatários
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';
            const { data: { session } } = await supabase.auth.getSession();

            for (const recipient of recipients) {
                try {
                    await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`
                        },
                        body: JSON.stringify({
                            to: recipient.email,
                            subject: `⚠️ Alerta de Estoque: ${med.name}`,
                            text: 'Email HTML - baixo estoque',
                            type: 'low_stock',
                            lowStockData: {
                                recipientName: recipient.full_name || recipient.email,
                                medicationName: med.name,
                                patientName: patient.name,
                                currentStock: med.quantity || 0,
                                daysRemaining: daysDisplay,
                                dosage: med.dosage || 'N/A',
                                dailyUsage: dailyUsage.toFixed(1),
                                suggestedQuantity: suggestedQuantity,
                                unit: med.type || 'unidades',
                                whatsappLink: whatsappLink,
                                threshold: threshold
                            }
                        })
                    });
                    console.log(`✅ Email enviado para ${recipient.email}`);
                } catch (err) {
                    console.error(`Erro ao enviar para ${recipient.email}:`, err);
                }
            }

            return { lastAlertDate: todayStr };

        } catch (err) {
            console.error('Erro ao processar alerta de estoque:', err);
            return null;
        }
    },

    runCaregiverCheck: async (user, prescriptions, medications, patients, consumptionLog, showToast) => {
        showToast('Iniciando verificação de cuidador...', 'info');
        console.log('--- Iniciando Check de Cuidador ---');

        let alertsSent = 0;
        const now = new Date();
        const todayStr = getISODate();

        const activePrescriptions = prescriptions.filter(p => !p.endDate || new Date(p.endDate) >= new Date().setHours(0, 0, 0, 0));

        for (const p of activePrescriptions) {
            if (!p.times || !Array.isArray(p.times)) continue;

            const med = medications.find(m => m.id === p.medicationId);
            const patient = patients.find(pt => pt.id === p.patientId);

            for (const timeStr of p.times) {
                const [h, m] = timeStr.split(':').map(Number);
                const schedDate = new Date();
                schedDate.setHours(h, m, 0, 0);

                const diffMins = (now - schedDate) / 60000;

                // Se passou mais de 15 minutos do horário e NÃO tomou
                if (diffMins > 15 && diffMins < 1440) {
                    const log = consumptionLog.find(l =>
                        (l.prescriptionId === p.id || l.prescription_id === p.id) &&
                        (l.scheduledTime === timeStr || l.scheduled_time === timeStr) &&
                        (l.date === todayStr || (l.taken_at && l.taken_at.startsWith(todayStr)))
                    );

                    if (!log) {
                        // VERIFICAR SE JÁ ALERTAMOS HOJE PARA ESTE HORÁRIO
                        const { data: alreadyAlerted } = await supabase
                            .from('alert_logs')
                            .select('id')
                            .eq('prescription_id', p.id)
                            .eq('alert_date', todayStr)
                            .eq('alert_time', timeStr)
                            .maybeSingle();

                        if (alreadyAlerted) {
                            console.log(`Paciência JÁ avisado hoje para ${med?.name} as ${timeStr}`);
                            continue;
                        }

                        console.log(`🚨 ATRASO DETECTADO: ${patient?.name} - ${med?.name} (${timeStr})`);
                        alertsSent++;

                        try {
                            const recipients = [];
                            if (user.email) recipients.push(user.email);
                            if (patient?.sharedWith) {
                                patient.sharedWith.forEach(s => {
                                    if (s.status === 'accepted') recipients.push(s.email);
                                });
                            }

                            const { data: { session } } = await supabase.auth.getSession();
                            await fetch(`${import.meta.env.VITE_API_URL || ''}/api/send-email`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({
                                    to: recipients.join(','),
                                    subject: `🚨 ALERTA DE ATRASO: ${patient?.name}`,
                                    text: `O paciente ${patient?.name} não tomou ${med?.name} agendado para ${timeStr}.\nAtraso de ${Math.floor(diffMins)} minutos.`,
                                    type: 'alert'
                                })
                            });

                            await supabase.from('alert_logs').insert({
                                prescription_id: p.id,
                                patient_id: p.patientId,
                                alert_date: todayStr,
                                alert_time: timeStr,
                                sent_to: recipients
                            });

                            showToast(`Alerta enviado: ${patient?.name} / ${med?.name}`, 'warning');

                        } catch (err) {
                            console.error('Falha ao enviar email de alerta', err);
                        }
                    }
                }
            }
        }

        if (alertsSent === 0) {
            showToast('Verificação concluída. Nenhuns atrasos novos.', 'success');
        } else {
            showToast(`${alertsSent} alertas de atraso enviados!`, 'warning');
        }

        return alertsSent;
    }
};
